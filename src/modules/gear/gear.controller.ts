import { Request, Response } from "express";

import { AppError } from "../../middlewares/AppError.js";
import { gearService } from "./gear.service.js";
import type { GearListQuery } from "./gear.validation.js";

const getProviderId = (req: Request): string => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  return userId;
};

const getGearParamId = (req: Request): string => {
  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid gear id", 400);
  }

  return id;
};

const createGear = async (req: Request, res: Response) => {
  const gear = await gearService.createGear(getProviderId(req), req.body);

  res.status(201).json({
    success: true,
    message: "Gear created successfully",
    data: gear,
  });
};

const getGears = async (req: Request, res: Response) => {
  const gears = await gearService.getGears(req.query as GearListQuery);

  res.status(200).json({
    success: true,
    message: "Gears fetched successfully",
    data: gears.data,
    meta: gears.meta,
  });
};

const getGearById = async (req: Request, res: Response) => {
  const gear = await gearService.getGearById(getGearParamId(req));

  res.status(200).json({
    success: true,
    message: "Gear fetched successfully",
    data: gear,
  });
};

const updateGear = async (req: Request, res: Response) => {
  const gear = await gearService.updateGear(
    getGearParamId(req),
    getProviderId(req),
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Gear updated successfully",
    data: gear,
  });
};

const deleteGear = async (req: Request, res: Response) => {
  await gearService.deleteGear(getGearParamId(req), getProviderId(req));

  res.status(200).json({
    success: true,
    message: "Gear deleted successfully",
  });
};

export const gearController = {
  createGear,
  getGears,
  getGearById,
  updateGear,
  deleteGear,
};
