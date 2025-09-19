import BaseDataService from './BaseDataService';
import usersData from '../data/users.json';

/**
 * 用戶資料服務
 * 專門處理用戶帳號相關的 CRUD 操作
 */
class UserService extends BaseDataService {
  constructor() {
    super('monkind_users'); // localStorage key
    this.currentUser = this._getCurrentUserFromStorage();
    this.initializeData(usersData);
  }

  /**
   * 用戶註冊
   */
  async register(userData) {
    try {
      // 驗證註冊資料
      const validation = await this.validateUserData(userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 檢查 email 是否已存在
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('此 Email 已被註冊');
      }

      // 創建新用戶（密碼應該在實際應用中加密）
      const newUser = await this.create({
        ...userData,
        password: this._hashPassword(userData.password), // 簡單的模擬加密
        role: 'user',
        isActive: true,
        emailVerified: false,
        profile: {
          avatar: '',
          phone: '',
          address: '',
          birthDate: '',
          preferences: {
            newsletter: true,
            notifications: true
          }
        },
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          favoriteCategory: null
        }
      });

      // 移除密碼後回傳
      const { password, ...userWithoutPassword } = newUser;
      console.log('用戶註冊成功:', userWithoutPassword.email);

      return userWithoutPassword;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * 用戶登入
   */
  async login(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error('用戶不存在');
      }

      if (!user.isActive) {
        throw new Error('帳號已被停用');
      }

      // 驗證密碼（實際應用中應使用加密比較）
      if (user.password !== this._hashPassword(password)) {
        throw new Error('密碼錯誤');
      }

      // 更新最後登入時間
      await this.update(user.id, {
        lastLoginAt: new Date().toISOString()
      });

      // 設定當前用戶
      const { password: _, ...userWithoutPassword } = user;
      this._setCurrentUser(userWithoutPassword);

      console.log('用戶登入成功:', email);
      return userWithoutPassword;
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }

  /**
   * 用戶登出
   */
  async logout() {
    try {
      this._setCurrentUser(null);
      console.log('用戶已登出');
      return true;
    } catch (error) {
      console.error('Error logging out user:', error);
      throw new Error('登出失敗');
    }
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 檢查是否已登入
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * 檢查是否為管理員
   */
  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  /**
   * 根據 Email 查找用戶
   */
  async findByEmail(email) {
    try {
      const allUsers = await this.getAll();
      return allUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * 更新用戶個人資料
   */
  async updateProfile(userId, profileData) {
    try {
      const user = await this.getById(userId);

      const updatedUser = await this.update(userId, {
        profile: {
          ...user.profile,
          ...profileData
        }
      });

      // 如果是當前用戶，更新本地快取
      if (this.currentUser && this.currentUser.id === userId) {
        const { password, ...userWithoutPassword } = updatedUser;
        this._setCurrentUser(userWithoutPassword);
      }

      console.log('用戶資料更新成功:', userId);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * 變更密碼
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await this.getById(userId);

      // 驗證舊密碼
      if (user.password !== this._hashPassword(oldPassword)) {
        throw new Error('舊密碼錯誤');
      }

      // 驗證新密碼
      if (newPassword.length < 6) {
        throw new Error('新密碼長度至少 6 個字元');
      }

      await this.update(userId, {
        password: this._hashPassword(newPassword)
      });

      console.log('密碼變更成功:', userId);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶統計資料
   */
  async getUserStats() {
    try {
      const allUsers = await this.getAll();

      return {
        total: allUsers.length,
        active: allUsers.filter(u => u.isActive).length,
        verified: allUsers.filter(u => u.emailVerified).length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        recentSignups: allUsers.filter(u => {
          const signupDate = new Date(u.createdAt);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return signupDate > oneWeekAgo;
        }).length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total: 0,
        active: 0,
        verified: 0,
        admins: 0,
        recentSignups: 0
      };
    }
  }

  /**
   * 驗證用戶資料
   */
  async validateUserData(userData) {
    const errors = [];

    // 姓名驗證
    if (!userData.name || userData.name.trim().length < 2) {
      errors.push('姓名至少需要 2 個字元');
    }

    // Email 驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
      errors.push('請輸入有效的 Email 地址');
    }

    // 密碼驗證
    if (!userData.password || userData.password.length < 6) {
      errors.push('密碼長度至少需要 6 個字元');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 搜尋用戶
   */
  async searchUsers({ name, email, role, isActive }) {
    try {
      const allUsers = await this.getAll();

      return allUsers.filter(user => {
        if (name && !user.name.toLowerCase().includes(name.toLowerCase())) {
          return false;
        }

        if (email && !user.email.toLowerCase().includes(email.toLowerCase())) {
          return false;
        }

        if (role && user.role !== role) {
          return false;
        }

        if (isActive !== undefined && user.isActive !== isActive) {
          return false;
        }

        return true;
      }).map(user => {
        // 移除密碼
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('用戶搜尋失敗');
    }
  }

  /**
   * 重置為預設用戶資料
   */
  async resetToDefault() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem('monkind_current_user');
      this.currentUser = null;
      this.isInitialized = false;
      this.initializeData(usersData);

      console.log('用戶資料已重置為預設值');
      return await this.getAll();
    } catch (error) {
      console.error('Error resetting users to default:', error);
      throw new Error('重置用戶資料失敗');
    }
  }

  /**
   * 簡單的密碼加密（實際應用中應使用 bcrypt 等）
   */
  _hashPassword(password) {
    // 這是極簡的示範，實際應用中絕對不要這樣做
    return btoa(password + 'monkind_salt_2024');
  }

  /**
   * 設定當前用戶
   */
  _setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('monkind_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('monkind_current_user');
    }
  }

  /**
   * 從 localStorage 獲取當前用戶
   */
  _getCurrentUserFromStorage() {
    try {
      const userData = localStorage.getItem('monkind_current_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user from storage:', error);
      return null;
    }
  }
}

// 建立單例實例
const userService = new UserService();

export default userService;