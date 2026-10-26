import { Property, RoomType, Policy, DateAdjustment } from '../types';

const parseArray = (val: any): string[] => {
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : v?.text ?? v?.name ?? '').filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];

    try {
      // Try parsing if it's a JSON string like '["a", "b"]'
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // Fall through to manual splitting
    }

    // Use semicolon as the primary "safe" separator if it exists
    if (trimmed.includes(';')) {
      return trimmed.split(';').map(s => s.trim()).filter(Boolean);
    }

    // Fallback to comma if no semicolon is found
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

const linkedIds = (val: any): string[] => {
  if (!Array.isArray(val)) return val ? [String(val)] : [];
  return val.map(v => typeof v === 'string' ? v : v?.record_id ?? v?.recordId ?? '').filter(Boolean);
};

const parseBoolean = (value: unknown): boolean =>
  value === true || value === 1 || (typeof value === 'string' && ['true', '1'].includes(value.trim().toLowerCase()));

export const fetchAllData = async () => {
  try {
    const response = await fetch('/api/properties');
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(`Property API returned ${response.status}${detail.code ? ` (Lark ${detail.code})` : ''}`);
    }
    const { branches, rooms, settings } = await response.json();
    return { branches, rooms, settings, discounts: [], amenities: [], branchAmenities: [], roomAmenities: [], dateAdjustments: [] };
  } catch (error) {
    console.error('Unexpected error in fetchAllData:', error);
    throw error;
  }
};

export const fetchProperties = async (): Promise<{
  properties: Property[],
  masterPropertyAmenities: string[],
  masterRoomAmenities: string[],
  generalPolicies: Policy[],
  dateAdjustments: DateAdjustment[]
}> => {
  const { branches, rooms, discounts, amenities, branchAmenities, roomAmenities, settings, dateAdjustments } = await fetchAllData();

  const getTranslatedValue = (item: any, field: string, defaultValue: any = '') => {
    return item[field] || defaultValue;
  };

  // Get general policies from settings table if available
  let generalPolicies: Policy[] = [];
  const policySetting = settings.find((s: any) =>
    s.key === 'general_policies' || s.name === 'general_policies' ||
    s.key === 'general_policy' || s.name === 'general_policy'
  );

  if (policySetting) {
    try {
      const rawValue = policySetting.value;

      const parsedValue = typeof rawValue === 'string'
        ? JSON.parse(rawValue)
        : rawValue;
      if (Array.isArray(parsedValue)) generalPolicies = parsedValue;
    } catch (e) {
      console.error('Error parsing policies:', e);
    }
  }

  if (generalPolicies.length === 0) {
    generalPolicies = [
      { title: 'Giờ giấc', content: 'Giờ giấc tự do 24/7, không chung chủ.' },
      { title: 'An ninh', content: 'Hệ thống camera an ninh và khóa vân tay hiện đại.' },
      { title: 'Vệ sinh', content: 'Dịch vụ dọn dẹp khu vực chung hàng tuần.' },
      { title: 'Thanh toán', content: 'Thanh toán tiền phòng từ ngày 1 đến ngày 5 hàng tháng.' }
    ];
  }

  const masterPropertyAmenities = amenities
    .filter(a => a.category === 'property' || a.category === 'general')
    .map(a => getTranslatedValue(a, 'name'));

  const masterRoomAmenities = amenities
    .filter(a => a.category === 'room' || a.category === 'general')
    .map(a => getTranslatedValue(a, 'name'));

  // Map data to our frontend types
  const properties = branches.filter(branch => typeof branch.name === 'string' && branch.name.trim()).map(branch => {
    // Try to match branch ID with room's branch reference in various formats
    const branchRooms: RoomType[] = rooms
      .filter(room => {
        const rBranchIds = linkedIds(room.branches ?? room.branch_id ?? room.branchId ?? room.branchid ?? room.branch_ID);
        const references = [branch.id, branch.record_id, branch.name]
          .filter(Boolean).map(value => String(value).trim().toLowerCase());
        return rBranchIds.some(id => references.includes(id.trim().toLowerCase()));
      })
      .map(room => {
        // Robust mapping for amenities
        let roomAmenitiesList = parseArray(getTranslatedValue(room, 'amenities'));

        if (roomAmenitiesList.length === 0 && roomAmenities?.length > 0 && amenities?.length > 0) {
          roomAmenitiesList = roomAmenities
            .filter((ra: any) => String(ra.room_type_id) === String(room.id))
            .map((ra: any) => {
              const amenity = amenities.find((a: any) => a.id === ra.amenity_id);
              return amenity ? getTranslatedValue(amenity, 'name') : null;
            })
            .filter(Boolean) as string[];
        }

        if (roomAmenitiesList.length === 0) {
          roomAmenitiesList = ['Máy lạnh', 'Wifi', 'Tủ lạnh'];
        }

        const branchStorageFolderRaw = branch.storage_folder || branch.storageFolder || branch.storagefolder;
        const roomStorageFolderPartRaw = room.storage_folder || room.storageFolder || room.storagefolder;

        const branchStorageFolder = typeof branchStorageFolderRaw === 'string' ? branchStorageFolderRaw.trim() : undefined;
        const roomStorageFolderPart = typeof roomStorageFolderPartRaw === 'string' ? roomStorageFolderPartRaw.trim() : undefined;

        let roomStorageFolder = roomStorageFolderPart;
        if (branchStorageFolder && roomStorageFolderPart) {
          const cleanBranch = branchStorageFolder.replace(/^\/+|\/+$/g, '');
          const cleanRoom = roomStorageFolderPart.replace(/^\/+|\/+$/g, '');
          roomStorageFolder = cleanRoom.startsWith(cleanBranch) ? cleanRoom : `${cleanBranch}/${cleanRoom}`;
        } else if (branchStorageFolder) {
          roomStorageFolder = branchStorageFolder.replace(/^\/+|\/+$/g, '');
        } else if (roomStorageFolderPart) {
          roomStorageFolder = roomStorageFolderPart.replace(/^\/+|\/+$/g, '');
        }

        return {
          id: String(room.id),
          name: getTranslatedValue(room, 'name', 'Loại phòng'),
          sqm: Number(room.sqm ?? room.area ?? 0),
          storageFolder: roomStorageFolder,
          images: parseArray(room.images).length > 0 ? parseArray(room.images) : [
            'https://picsum.photos/seed/room1/300/225',
            'https://picsum.photos/seed/room2/300/225'
          ],
          amenities: roomAmenitiesList,
          excludedAmenities: parseArray(getTranslatedValue(room, 'excluded_amenities')),
          pricing: {
            monthly: Number(room.monthly_over ?? 0),
            monthly_under: Number(room.monthly_under ?? 0),
            minContractMonths: Number(room.min_contract_months ?? room.minContractMonths ?? room.mincontractmonths ?? 1),
            fees: (typeof room.fees === 'string' ? room.fees : parseArray(room.fees).join(', ')) || 'Điện 4k, Nước 100k/ng'
          },
          tag: room.tag || '',
          isHidden: parseBoolean(room.is_hidden ?? room.isHidden ?? room.ishidden)
        };
      })
      .sort((a, b) => a.pricing.monthly - b.pricing.monthly);

    const promotion = getTranslatedValue(branch, 'promotion', discounts.length > 0 ? getTranslatedValue(discounts[0], 'name') : '');

    let branchAmenitiesList = parseArray(getTranslatedValue(branch, 'amenities'));
    if (branchAmenitiesList.length === 0 && branchAmenities?.length > 0 && amenities?.length > 0) {
      branchAmenitiesList = branchAmenities
        .filter((ba: any) => String(ba.branch_id) === String(branch.id))
        .map((ba: any) => {
          const amenity = amenities.find((a: any) => a.id === ba.amenity_id);
          return amenity ? getTranslatedValue(amenity, 'name') : null;
        })
        .filter(Boolean) as string[];
    }

    if (branchAmenitiesList.length === 0) {
      branchAmenitiesList = ['Wifi', 'Bảo vệ 24/7', 'Thang máy'];
    }

    const bStorageFolderRaw = branch.storage_folder || branch.storageFolder || branch.storagefolder;
    const bStorageFolder = typeof bStorageFolderRaw === 'string' ? bStorageFolderRaw.trim() : undefined;

    const branchPolicies = getTranslatedValue(branch, 'policies');

    return {
      id: String(branch.id),
      name: getTranslatedValue(branch, 'name', 'Cơ sở'),
      address: getTranslatedValue(branch, 'address', 'Địa chỉ đang cập nhật'),
      description: getTranslatedValue(branch, 'description', 'Không gian sống hiện đại, tiện nghi.'),
      storageFolder: bStorageFolder,
      images: parseArray(branch.images).length > 0 ? parseArray(branch.images) : ['https://picsum.photos/seed/branch/400/300'],
      amenities: branchAmenitiesList,
      excludedAmenities: parseArray(getTranslatedValue(branch, 'excluded_amenities')),
      policies: Array.isArray(branchPolicies) ? branchPolicies : typeof branchPolicies === 'string' && branchPolicies.trim().startsWith('[') ? (() => {
        try { return JSON.parse(branchPolicies) as Policy[]; } catch { return []; }
      })() : [
        { title: 'Chính sách chung', content: 'Giờ giấc tự do, không chung chủ.' }
      ],
      promotion,
      tag: branch.tag || '',
      isHidden: parseBoolean(branch.is_hidden ?? branch.isHidden ?? branch.ishidden),
      rooms: branchRooms
    };
  });

  return {
    properties,
    masterPropertyAmenities: masterPropertyAmenities.length > 0 ? masterPropertyAmenities : ['Wifi', 'Dọn phòng', 'Thang máy'],
    masterRoomAmenities: masterRoomAmenities.length > 0 ? masterRoomAmenities : ['Máy lạnh', 'Wifi', 'Ban công'],
    generalPolicies,
    dateAdjustments
  };
};
