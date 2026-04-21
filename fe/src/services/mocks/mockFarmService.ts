/**
 * Mock Farm Service — Phase 3.1 (FR-F01, FR-T07)
 *
 * Giả lập Farm Service (dùng thủ công / test; không gắn VITE_USE_MOCK).
 * Types import từ farmService.ts (nguồn sự thật duy nhất về hợp đồng DTO).
 *
 * Mỗi hàm trả Promise với độ trễ ~1 giây qua withMockDelay,
 * JSON khớp 1-1 với hợp đồng FarmDto / ListResponse<FarmDto> trong
 * specs/backend-api-specification/design.md §4.3.
 */

import { withMockDelay } from './index';
import type {
  FarmDto,
  FarmLocation,
  ListResponse,
  ListFarmsParams,
  CreateFarmDto,
  UpdateFarmDto,
} from '@/services/farmService';

// Re-export types for consumers that import from this module
export type { FarmDto, FarmLocation, ListResponse, ListFarmsParams, CreateFarmDto, UpdateFarmDto };

// ── Mock data store ───────────────────────────────────────────────────────────

const SEED_FARMS: FarmDto[] = [
  {
    id: 'farm-001',
    ownerId: 'usr_farmer_001',
    name: 'Farm Lab Đông A',
    location: {
      province: 'Tiền Giang',
      district: 'Châu Thành',
      addressLine: 'Xã Tân Thành, Huyện Châu Thành',
      lat: 10.3833,
      lng: 106.3667,
    },
    area: 25000,
    cropType: 'dragon_fruit',
    standardId: 'std-vietgap-001',
    createdAt: '2023-01-15T08:00:00.000Z',
    updatedAt: '2024-06-10T10:30:00.000Z',
  },
  {
    id: 'farm-002',
    ownerId: 'usr_farmer_001',
    name: 'Vườn Bưởi Da Xanh',
    location: {
      province: 'Bến Tre',
      district: 'Châu Thành',
      addressLine: 'Xã Phú Đức, Huyện Châu Thành',
      lat: 10.2000,
      lng: 106.3500,
    },
    area: 15000,
    cropType: 'pomelo',
    createdAt: '2022-05-20T08:00:00.000Z',
    updatedAt: '2024-04-01T09:00:00.000Z',
  },
  {
    id: 'farm-003',
    ownerId: 'user-farmer-002',
    name: 'Vườn Xoài Cát Chu',
    location: {
      province: 'Đồng Tháp',
      district: 'Cao Lãnh',
      addressLine: 'Xã Mỹ Hội, Huyện Cao Lãnh',
      lat: 10.4600,
      lng: 105.6333,
    },
    area: 30000,
    cropType: 'mango',
    createdAt: '2021-08-10T08:00:00.000Z',
    updatedAt: '2024-03-15T11:00:00.000Z',
  },
  {
    id: 'farm-004',
    ownerId: 'user-farmer-003',
    name: 'Thanh Long Ruột Đỏ Long An',
    location: {
      province: 'Long An',
      district: 'Châu Thành',
      addressLine: 'Xã Thanh Vĩnh Đông, Huyện Châu Thành',
      lat: 10.7000,
      lng: 106.4000,
    },
    area: 20000,
    cropType: 'dragon_fruit',
    standardId: 'std-globalgap-001',
    createdAt: '2020-11-05T08:00:00.000Z',
    updatedAt: '2024-05-20T14:00:00.000Z',
  },
  {
    id: 'farm-005',
    ownerId: 'user-farmer-004',
    name: 'Cam Sành Hà Giang',
    location: {
      province: 'Hà Giang',
      district: 'Bắc Mê',
      addressLine: 'Xã Giáp Trung, Huyện Bắc Mê',
      lat: 22.7000,
      lng: 105.3500,
    },
    area: 10000,
    cropType: 'orange',
    createdAt: '2023-03-22T08:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 'farm-006',
    ownerId: 'user-farmer-005',
    name: 'Nhãn Lồng Hưng Yên',
    location: {
      province: 'Hưng Yên',
      district: 'Khoái Châu',
      addressLine: 'Xã Đông Tảo, Huyện Khoái Châu',
      lat: 20.6517,
      lng: 106.0667,
    },
    area: 8000,
    cropType: 'longan',
    createdAt: '2023-06-01T08:00:00.000Z',
    updatedAt: '2024-02-28T08:00:00.000Z',
  },
];

let farmStore: FarmDto[] = [...SEED_FARMS];

// ── Service functions (mirror farmService.ts API surface) ─────────────────────

export async function listFarms(params: ListFarmsParams = {}): Promise<ListResponse<FarmDto>> {
  const { region, cropType, ownerId, page = 1, limit = 10 } = params;

  const filtered = farmStore.filter((f) => {
    if (ownerId && f.ownerId !== ownerId) return false;
    if (cropType && cropType !== 'all' && f.cropType !== cropType) return false;
    if (region && region !== 'all' && f.location.province !== region) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return withMockDelay({ items, page, limit, total });
}

export async function getFarm(id: string): Promise<FarmDto> {
  const farm = farmStore.find((f) => f.id === id);
  if (!farm) throw new Error(`NOT_FOUND: Farm ${id}`);
  return withMockDelay({ ...farm });
}

export async function createFarm(data: CreateFarmDto): Promise<FarmDto> {
  const now = new Date().toISOString();
  const newFarm: FarmDto = {
    ...data,
    id: `farm-${Date.now()}`,
    ownerId: 'usr_farmer_001',
    createdAt: now,
    updatedAt: now,
  };
  farmStore = [...farmStore, newFarm];
  return withMockDelay({ ...newFarm });
}

export async function updateFarm(id: string, data: UpdateFarmDto): Promise<FarmDto> {
  const idx = farmStore.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: Farm ${id}`);
  const updated: FarmDto = {
    ...farmStore[idx],
    ...data,
    location: data.location
      ? { ...farmStore[idx].location, ...data.location }
      : farmStore[idx].location,
    updatedAt: new Date().toISOString(),
  };
  farmStore = farmStore.map((f, i) => (i === idx ? updated : f));
  return withMockDelay({ ...updated });
}

export async function deleteFarm(id: string): Promise<{ success: true }> {
  farmStore = farmStore.filter((f) => f.id !== id);
  return withMockDelay({ success: true as const });
}
