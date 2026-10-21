// Vehicle API Service
// Provides wrapped API calls for vehicle-related endpoints using the configured axios instance

import service from "@/service/request";
import type { VehicleConfig } from '@/types/vehicle';

/**
 * Get all vehicle configs
 * @returns Promise with array of vehicle configs
 */
export const getVehicleConfigs = async (): Promise<VehicleConfig[]> => {
    const response = await service.get<VehicleConfig[]>('/vehicles/configs', {
        timeout: 30000 // 延长到 30 秒
    });
    console.log('Raw API Response:', JSON.stringify(response));
    return response as unknown as VehicleConfig[];
};

/**
 * Get a specific vehicle config by ID
 * @param id - The config ID to retrieve
 * @returns Promise with the vehicle config data
 */
export const getVehicleConfigById = async (id: string) => {
    const response = await service.get(`/vehicles/scrape/configs/${id}`, {
        timeout: 30000 // 延长到 30 秒
    });
    return response;
};

/**
 * Create a new vehicle config
 * @param data - The config data to create
 * @returns Promise with the created config
 */
export const createVehicleConfig = async (data: any) => {
    const response = await service.post(`/vehicles/configs`, data);
    return response.data;
};

/**
 * Update an existing vehicle config
 * @param id - The config ID to update
 * @param data - The updated config data
 * @returns Promise with the updated config
 */
export const updateVehicleConfig = async (id: string, data: any) => {
    const response = await service.put(`/vehicles/scrape/configs/${id}`, data);
    return response.data;
};

/**
 * Delete a vehicle config
 * @param id - The config ID to delete
 * @returns Promise with the delete result
 */
export const deleteVehicleConfig = async (id: string) => {
    const response = await service.delete(`/vehicles/scrape/configs/${id}`);
    return response;
};

/**
 * Execute a vehicle scraping task
 * @param configId - The config ID to execute
 * @param parsingRules - Optional custom parsing rules to override step-level rules
 * @returns Promise with the scrape result
 */
export const executeVehicleScrape = async (configId: string, parsingRules?: any[]) => {
    const payload = { config_id: configId };
    if (parsingRules && parsingRules.length > 0) {
        // @ts-ignore - parsing_rules is a dynamic property for the API
        payload.parsing_rules = parsingRules;
    }
    const response = await service.post(`/vehicles/scrape/execute`, payload);
    return response.data;
};

/**
 * Test connection for a vehicle config
 * @param configId - The config ID to test
 * @returns Promise with the connection test result
 */
export const testVehicleConnection = async (configId: string) => {
    const response = await service.post(`/vehicles/scrape/execute`, { config_id: configId });
    return response.data;
};
