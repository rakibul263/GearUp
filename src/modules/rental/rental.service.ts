import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import { getRentalDays } from "../../utils/date.js";
import { CreateRentalInput } from "./rental.validation.js";

const ACTIVE_RENTAL_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PAID",
  "PICKED_UP",
] as const;

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

  const gears = await prisma.gear.findMany({
    where: {
      id: {
        in: gearIds,
      },
    },
  });

  if (gears.length !== gearIds.length) {
    throw new AppError("One or more gear items were not found", 404);
  }

  for (const requestedItem of requestedItems) {
    const gear = gears.find((item) => item.id === requestedItem.gearItemId);

    if (!gear) {
      throw new AppError("Gear item not found", 404);
    }

    if (!gear.isAvailable) {
      throw new AppError(`${gear.name} is currently unavailable`, 409);
    }

    if (requestedItem.quantity > gear.stock) {
      throw new AppError(`Not enough stock available for ${gear.name}`, 409);
    }
  }

  const overlappingOrders = await prisma.rentalOrder.findMany({
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
    const gear = gears.find((item) => item.id === requestedItem.gearItemId);

    if (!gear) {
      continue;
    }

    const reservedQuantity = overlappingOrders.reduce((total, order) => {
      const matchingItem = order.rentalItems.find(
        (item) => item.gearItemId === requestedItem.gearItemId,
      );

      return total + (matchingItem?.quantity ?? 0);
    }, 0);

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
    const gear = gears.find((item) => item.id === requestedItem.gearItemId);

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

  const order = await prisma.rentalOrder.create({
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

export const rentalService = {
  createRental,
  getCustomerRentals,
  getRentalById,
};
