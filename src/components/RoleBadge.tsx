import { getUserByName, getRoleLabel, getRoleColor, type PilotRole } from '@/data/users';

interface RoleBadgeProps {
  playerName: string;
  role?: PilotRole;
  size?: 'sm' | 'md';
}

const RoleBadge = ({ playerName, role, size = 'sm' }: RoleBadgeProps) => {
  const resolvedRole = role ?? getUserByName(playerName)?.role;
  if (!resolvedRole) return null;

  const colorClasses = getRoleColor(resolvedRole);
  const label = getRoleLabel(resolvedRole);

  return (
    <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${colorClasses} ${
      size === 'sm' ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'
    }`}>
      {label}
    </span>
  );
};

export default RoleBadge;
