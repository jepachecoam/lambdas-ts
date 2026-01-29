class Dto {
  static filterDuplicatesByExcludedIds(duplicates: any[]): any[] {
    const excludedIdsByType: { [key: string]: string[] } = {
      "bussinessConfigNotification-phone": ["3000000000"],
      "userBeneficiary-phone": ["3000000000"],
      "userProfilingResponse-phoneNumber": ["3000000000"],
      "userBeneficiary-documentNumber": ["1000000000"]
    };

    return duplicates.filter((duplicate) => {
      const excludedIds = excludedIdsByType[duplicate.type];
      if (!excludedIds) return true;
      return !excludedIds.includes(duplicate.id);
    });
  }
}

export default Dto;
