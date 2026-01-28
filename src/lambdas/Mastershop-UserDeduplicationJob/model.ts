import concurrency from "../../shared/services/concurrency";
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

      const uniqueUsers = [...new Set(allUsers)];

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
    let mergedGroups: any[] = [];
    let hasChanges = true;

    // Inicializar con todos los grupos
    for (const duplicate of duplicates) {
      mergedGroups.push({ ...duplicate });
    }

    // Repetir hasta que no haya más fusiones
    while (hasChanges) {
      hasChanges = false;
      const newMergedGroups: any[] = [];

      for (const group of mergedGroups) {
        let merged = false;

        for (const existingGroup of newMergedGroups) {
          const hasSharedUser = group.users.some((userId: number) =>
            existingGroup.users.includes(userId)
          );

          if (hasSharedUser) {
            const uniqueUsers = [
              ...new Set([...existingGroup.users, ...group.users])
            ];
            existingGroup.users = uniqueUsers;
            merged = true;
            hasChanges = true;
            break;
          }
        }

        if (!merged) {
          newMergedGroups.push({ ...group });
        }
      }

      mergedGroups = newMergedGroups;
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

    const mergedGroups = this.mergeGroupsBySharedUsers(allDuplicates);

    const allUserIds = mergedGroups.flatMap((group) => group.users);
    const userClustersMap = await this.dao.getUserClusters(allUserIds);

    const groupsWithClusters = mergedGroups.map((group) => ({
      id: group.id,
      type: group.type,
      users: group.users.map((userId: number) => ({
        idUser: userId,
        idCluster: userClustersMap[userId]
      }))
    }));

    return groupsWithClusters;
  }

  async getDuplicatesWithWinnersAndLosers() {
    const mergedGroups = await this.getAllDuplicatesWithMergedGroups();

    return mergedGroups.map((group) => {
      const sortedUsers = group.users.sort(
        (a: any, b: any) => a.idUser - b.idUser
      );

      const winner = sortedUsers[0];
      const losers = sortedUsers.slice(1);

      return {
        id: group.id,
        type: group.type,
        users: {
          winner,
          losers
        }
      };
    });
  }

  private filterLosersWithDifferentCluster(winner: any, losers: any[]) {
    return losers.filter((loser) => loser.idCluster !== winner.idCluster);
  }

  private async updateGroupCluster(group: any) {
    const { winner, losers } = group.users;

    const losersToUpdate = this.filterLosersWithDifferentCluster(
      winner,
      losers
    );

    if (losersToUpdate.length === 0) return;

    const userIdsToUpdate = losersToUpdate.map((loser) => loser.idUser);
    await this.dao.updateUserClusterMembers(userIdsToUpdate, winner.idCluster);
  }

  async processAndUpdateDuplicateClusters() {
    const duplicateGroups = await this.getDuplicatesWithWinnersAndLosers();

    const updateTasks = duplicateGroups.map(
      (group) => () => this.updateGroupCluster(group)
    );

    await concurrency.executeWithLimit({
      tasks: updateTasks,
      concurrencyLimit: 10
    });

    return duplicateGroups;
  }
}

export default Model;
