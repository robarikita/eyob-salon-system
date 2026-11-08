import prisma from "../../utils/prisma";

export interface CreateNotificationInput {
  userId: string;
  branchId?: string | null;
  title: string;
  message: string;
  type: string; // GOVERNANCE_REQUEST, APPROVAL_NOTICE, OWNER_MUTATION
  link?: string;
}

export class NotificationService {
  /**
   * List notifications for a specific user
   */
  static async listNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      return null;
    }

    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Create a direct notification
   */
  static async createNotification(data: CreateNotificationInput) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        branchId: data.branchId || null,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null,
      },
    });
  }

  /**
   * Send notification to all system Owners
   */
  static async notifyOwners(data: Omit<CreateNotificationInput, "userId">) {
    const owners = await prisma.user.findMany({
      where: { role: "OWNER" },
      select: { id: true },
    });

    if (owners.length === 0) return [];

    const creations = owners.map((owner) =>
      prisma.notification.create({
        data: {
          userId: owner.id,
          branchId: data.branchId || null,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link || null,
        },
      })
    );

    return await Promise.all(creations);
  }

  /**
   * Send notification to all Branch Admins assigned to a specific branch
   */
  static async notifyBranchAdmins(
    branchId: string,
    data: Omit<CreateNotificationInput, "userId" | "branchId">
  ) {
    const admins = await prisma.user.findMany({
      where: { branchId, role: "BRANCH_ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) return [];

    const creations = admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          branchId,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link || null,
        },
      })
    );

    return await Promise.all(creations);
  }
}

