import { useAuthContext } from "../../auth/contexts/AuthContext"
import { UserProfile as UserProfileComponent } from "../components/UserProfile"

const UserProfile: React.FC = () => {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return <UserProfileComponent user={user} />;
};

export default UserProfile;
