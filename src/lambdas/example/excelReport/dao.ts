class Dao {
  async otherData(id: 1 | 2) {
    if (id === 1) return mockData;
    if (id === 2) return mockLargeData;
    return [];
  }
}

export default Dao;

const mockData = [
  { columX: 1, columY: 2 },
  { columX: 3, columY: 4 },
  { columX: 5, columY: 6 }
];

const mockLargeData = [
  { columX: 1, columY: 2 },
  { columX: 3, columY: 4 },
  { columX: 5, columY: 6 },
  { columX: 7, columY: 8 },
  { columX: 9, columY: 10 },
  { columX: 11, columY: 12 },
  { columX: 13, columY: 14 },
  { columX: 15, columY: 16 },
  { columX: 17, columY: 18 },
  { columX: 19, columY: 20 }
];
