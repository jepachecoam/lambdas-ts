import Dao from "./dao";
class Model {
  constructor(private dao: Dao) {
    this.dao = dao;
  }

  async getCredentialDuplicates() {
    const duplicateCredentials = await this.dao.getDuplicatesCredentials();

    const allBusinessIds = duplicateCredentials.flatMap(
      (item: any) => item.business
    );

    const businessToUsersMap =
      await this.dao.getBusinessOwnersFromBusinessIds(allBusinessIds);

    const credentialDuplicatesResult = [];

    for (const credential of duplicateCredentials) {
      const allUsers = credential.business.flatMap(
        (businessId: any) => businessToUsersMap[businessId] || []
      );

      const uniqueUsers = allUsers.filter(
        (user: any, index: number, self: any[]) =>
          index === self.findIndex((u: any) => u.idUser === user.idUser)
      );

      if (uniqueUsers.length >= 2) {
        credentialDuplicatesResult.push({
          id: credential.id,
          type: credential.type,
          users: uniqueUsers
        });
      }
    }

    return credentialDuplicatesResult;
  }

  private mergeGroupsBySharedUsers(duplicates: any[]) {
    const mergedGroups: any[] = [];

    for (const duplicate of duplicates) {
      let merged = false;

      for (const group of mergedGroups) {
        const hasSharedUser = duplicate.users.some((user: any) =>
          group.users.some((groupUser: any) => groupUser.idUser === user.idUser)
        );

        if (hasSharedUser) {
          const uniqueUsers = [...group.users, ...duplicate.users].filter(
            (user: any, index: number, self: any[]) =>
              index === self.findIndex((u: any) => u.idUser === user.idUser)
          );
          group.users = uniqueUsers;
          merged = true;
          break;
        }
      }

      if (!merged) {
        mergedGroups.push({ ...duplicate });
      }
    }

    return mergedGroups;
  }

  async getAllDuplicatesWithMergedGroups() {
    const credentialDuplicates = await this.getCredentialDuplicates();
    const notificationDuplicates =
      await this.dao.getDuplicatesBussinessConfigNotification();
    const documentDuplicates =
      await this.dao.getDuplicatesUserBeneficiaryDocumentNumber();
    const phoneDuplicates = await this.dao.getDuplicatesUserBeneficiaryPhone();
    const profilingDuplicates =
      await this.dao.getDuplicatesUserProfilingResponse();

    const allDuplicates = [
      ...credentialDuplicates,
      ...notificationDuplicates,
      ...documentDuplicates,
      ...phoneDuplicates,
      ...profilingDuplicates
    ];

    return this.mergeGroupsBySharedUsers(allDuplicates);
  }

  private isValidDate(dateValue: any): boolean {
    if (!dateValue) return false;

    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  }

  async getDuplicatesWithWinnersAndLosers() {
    const mergedGroups = await this.getAllDuplicatesWithMergedGroups();

    const validGroups = [];

    for (const group of mergedGroups) {
      const usersWithValidDates = group.users.filter((user: any) =>
        this.isValidDate(user.createdAt)
      );
      const usersWithInvalidDates = group.users.filter(
        (user: any) => !this.isValidDate(user.createdAt)
      );

      if (usersWithValidDates.length === 0) {
        continue;
      }

      const sortedValidUsers = usersWithValidDates.sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const winner = sortedValidUsers[0];
      const losers = [...sortedValidUsers.slice(1), ...usersWithInvalidDates];

      validGroups.push({
        id: group.id,
        type: group.type,
        users: {
          winner,
          losers
        }
      });
    }

    return validGroups;
  }
}

export default Model;
