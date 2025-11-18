import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import "../profileCalendar.scss";

type ProfileCardProps = {
    profile: UserInstance;
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  // Role bilgisini belirleme: önce profile'dan, yoksa localStorage'dan
  const getRoleDisplay = (): string => {
    // Eğer profile yüklenmişse ve role bilgisi varsa
    if (profile?.role) {
      // Role bir obje ise (örn: { id: 1, name: "Admin" })
      if (typeof profile.role === 'object' && profile.role !== null && 'name' in profile.role) {
        return profile.role.name;
      }
      // Role direkt bir string veya number ise
      return String(profile.role);
    }
    // Profile henüz yüklenmemişse localStorage'dan al
    const roleFromStorage = AuthSession.getRoles();
    return roleFromStorage ? String(roleFromStorage) : '';
  };

  const userName = profile?.name || AuthSession.getName() || 'User';
  const userEmail = profile?.email || AuthSession.getEmail() || '';
  const userRole = getRoleDisplay();

  // Avatar için baş harf
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="profile-section">
      <div className="profile-avatar">
        <div className="avatar-circle">
          {getInitials(userName)}
        </div>
      </div>
      <div className="profile-info">
        <h2>Welcome, {userName}</h2>
        <div className="profile-details">
          <div className="profile-detail-item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16px"
              viewBox="0 -960 960 960"
              width="16px"
              className="detail-icon"
            >
              <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z" />
            </svg>
            <span>{userEmail}</span>
          </div>
          {userRole && (
            <div className="profile-detail-item role-badge">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="16px"
                viewBox="0 -960 960 960"
                width="16px"
                className="detail-icon"
              >
                <path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-360 196v176l280 152 280-152v-176L480-360 200-272v176l280 152 280-152v176L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z" />
              </svg>
              <span>{userRole}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;