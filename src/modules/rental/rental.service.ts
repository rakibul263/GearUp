import { Prisma } from "../../../generated/prisma/client.js";
import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import { getRentalDays } from "../../utils/date.js";
import type {
  CreateRentalInput,
  UpdateRentalStatusInput,
} from "./rental.validation.js";

const ACTIVE_RENTAL_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PAID",
  "PICKED_UP",
] as const;

const MAX_TRANSACTION_RETRIES = 3;

const createRental = async (customerId: string, data: CreateRentalInput) => {
  if (data.endDate <= data.startDate) {
    throw new AppError("End date must be after start date", 400);
  }

  const numberOfDays = getRentalDays(data.startDate, data.endDate);

  if (numberOfDays < 1) {
    throw new AppError("Rental duration must be at least 1 day", 400);
  }

  const uniqueItems = new Map<string, number>();

  for (const item of data.items) {
    const currentQuantity = uniqueItems.get(item.gearItemId) ?? 0;

    uniqueItems.set(item.gearItemId, currentQuantity + item.quantity);
  }

  const requestedItems = Array.from(uniqueItems.entries()).map(
    ([gearItemId, quantity]) => ({
      gearItemId,
      quantity,
    }),
  );

  const gearIds = requestedItems.map((item) => item.gearItemId);

  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const gears = await tx.gear.findMany({
            where: {
              id: {
                in: gearIds,
              },
            },
          });

          if (gears.length !== gearIds.length) {
            throw new AppError("One or more gear items were not found", 404);
          }

          const providerIds = new Set(gears.map((gear) => gear.providerId));

          if (providerIds.size > 1) {
            throw new AppError(
              "A rental order can contain gear from only one provider",
              400,
            );
          }

          for (const requestedItem of requestedItems) {
            const gear = gears.find(
              (item) => item.id === requestedItem.gearItemId,
            );

            if (!gear) {
              throw new AppError("Gear item not found", 404);
            }

            if (!gear.isAvailable) {
              throw new AppError(`${gear.name} is currently unavailable`, 409);
            }

            if (requestedItem.quantity > gear.stock) {
              throw new AppError(
                `Not enough stock available for ${gear.name}`,
                409,
              );
            }
          }

          const overlappingOrders = await tx.rentalOrder.findMany({
            where: {
              status: {
                in: [...ACTIVE_RENTAL_STATUSES],
              },

              startTime: {
                lt: data.endDate,
              },

              endTime: {
                gt: data.startDate,
              },

              rentalItems: {
                some: {
                  gearItemId: {
                    in: gearIds,
                  },
                },
              },
            },

            include: {
              rentalItems: true,
            },
          });

          for (const requestedItem of requestedItems) {
            const gear = gears.find(
              (item) => item.id === requestedItem.gearItemId,
            );

            if (!gear) {
              continue;
            }

            const reservedQuantity = overlappingOrders.reduce(
              (total, order) => {
                const matchingItem = order.rentalItems.find(
                  (item) => item.gearItemId === requestedItem.gearItemId,
                );

                return total + (matchingItem?.quantity ?? 0);
              },
              0,
            );

            const availableStock = gear.stock - reservedQuantity;

            if (requestedItem.quantity > availableStock) {
              throw new AppError(
                `Only ${Math.max(0, availableStock)} unit(s) of ${gear.name} are available for the selected dates`,
                409,
              );
            }
          }

          let subtotal = 0;

          const orderItems = requestedItems.map((requestedItem) => {
            const gear = gears.find(
              (item) => item.id === requestedItem.gearItemId,
            );

            if (!gear) {
              throw new AppError("Gear item not found", 404);
            }

            const itemSubtotal =
              Number(gear.pricePerDay) * requestedItem.quantity * numberOfDays;

            subtotal += itemSubtotal;

            return {
              gearItemId: gear.id,
              quantity: requestedItem.quantity,
              pricePerDay: gear.pricePerDay,
              numberOfDays,
              subTotal: itemSubtotal,
            };
          });

          const order = await tx.rentalOrder.create({
            data: {
              customerId,
              startTime: data.startDate,
              endTime: data.endDate,
              subtotal,
              totalAmount: subtotal,
              status: "PLACED",

              rentalItems: {
                create: orderItems,
              },
            },

            include: {
              rentalItems: {
                include: {
                  gearItem: {
                    select: {
                      id: true,
                      name: true,
                      pricePerDay: true,
                    },
                  },
                },
              },
            },
          });

          return order;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5000,
          timeout: 10000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < MAX_TRANSACTION_RETRIES
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(
    "Unable to create rental order due to concurrent booking attempts. Please try again.",
    409,
  );
};

const getCustomerRentals = async (customerId: string) => {
  return prisma.rentalOrder.findMany({
    where: {
      customerId,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      rentalItems: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              pricePerDay: true,
            },
          },
        },
      },

      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          provider: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });
};

const getRentalById = async (rentalId: string, customerId: string) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },

    include: {
      rentalItems: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              pricePerDay: true,
            },
          },
        },
      },

      payments: true,
    },
  });

  if (!rental) {
    throw new AppError("Rental order not found", 404);
  }

  return rental;
};

const cancelRental = async (rentalId: string, customerId: string) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },
  });

  if (!rental) {
    throw new AppError("Rental order not found", 404);
  }

  if (rental.status !== "PLACED") {
    throw new AppError("Only placed rental orders can be cancelled", 409);
  }

  const cancelledRental = await prisma.rentalOrder.update({
    where: {
      id: rental.id,
    },
    data: {
      status: "CANCELED",
    },
    include: {
      rentalItems: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              pricePerDay: true,
            },
          },
        },
      },
    },
  });

  return cancelledRental;
};

const getProviderRentals = async (providerId: string) => {
  return prisma.rentalOrder.findMany({
    where: {
      rentalItems: {
        some: {
          gearItem: {
            providerId,
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      rentalItems: {
        where: {
          gearItem: {
            providerId,
          },
        },

        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              pricePerDay: true,
              providerId: true,
            },
          },
        },
      },

      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          provider: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });
};

const updateProviderRentalStatus = async (
  rentalId: string,
  providerId: string,
  data: UpdateRentalStatusInput,
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,

      rentalItems: {
        some: {
          gearItem: {
            providerId,
          },
        },
      },
    },
  });

  if (!rental) {
    throw new AppError("Rental order not found", 404);
  }

  const allowedTransitions: Record<string, string[]> = {
    PLACED: ["CONFIRMED"],
    PAID: ["PICKED_UP"],
    PICKED_UP: ["RETURNED"],
  };

  const nextStatuses = allowedTransitions[rental.status] ?? [];

  if (!nextStatuses.includes(data.status)) {
    throw new AppError(
      `Cannot change rental status from ${rental.status} to ${data.status}`,
      409,
    );
  }

  const updatedRental = await prisma.rentalOrder.update({
    where: {
      id: rental.id,
    },

    data: {
      status: data.status,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      rentalItems: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              pricePerDay: true,
              providerId: true,
            },
          },
        },
      },

      payments: true,
    },
  });

  return updatedRental;
};

export const rentalService = {
  createRental,
  getCustomerRentals,
  getRentalById,
  cancelRental,
  getProviderRentals,
  updateProviderRentalStatus,
};
