import { supabase } from "./supabase";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'NEW_ISSUE' | 'ADMIN_RESPONSE';
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Create notifications for all admin users when a new issue is submitted
 */
export async function createNewIssueNotifications(issueId: string, issueTitle: string) {
  try {
    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found');
      return;
    }

    // Create notifications for each admin
    const notifications = adminUsers.map(admin => ({
      user_id: admin.id,
      title: 'New Issue Submitted',
      message: `A new issue "${issueTitle}" has been submitted and requires attention.`,
      type: 'NEW_ISSUE' as const,
      reference_id: issueId,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating new issue notifications:', notificationError);
    } else {
      console.log(`Created ${notifications.length} notifications for new issue`);
    }
  } catch (error) {
    console.error('Error in createNewIssueNotifications:', error);
  }
}

/**
 * Create notification for issue owner when admin posts an official response
 */
export async function createAdminResponseNotification(issueId: string, ownerId: string, issueTitle: string) {
  try {
    const notification = {
      user_id: ownerId,
      title: 'Official Response Received',
      message: `An administrator has posted an official response to your issue "${issueTitle}".`,
      type: 'ADMIN_RESPONSE' as const,
      reference_id: issueId,
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error creating admin response notification:', error);
    } else {
      console.log('Created admin response notification');
    }
  } catch (error) {
    console.error('Error in createAdminResponseNotification:', error);
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
  }
}
