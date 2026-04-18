import { toast } from "sonner";
import { ChevronDown, Check, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_USERS, userStore } from "@/lib/mock-data";
import { useCurrentUser } from "@/hooks/use-current-user";

export function UserSwitcher() {
  const current = useCurrentUser();

  const handleSwitch = (id: string) => {
    if (id === current.id) return;
    const next = DEMO_USERS.find((u) => u.id === id)!;
    userStore.set(id);
    toast.success(`Switched to ${next.name}`, {
      description: `Now viewing Kameti as ${next.role.toLowerCase()}.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 py-1 pl-1 pr-2.5 transition-colors hover:border-primary/40">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
          style={{ background: current.avatarColor }}
        >
          {current.initials}
        </div>
        <div className="hidden flex-col leading-none sm:flex">
          <span className="text-xs font-semibold">{current.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {current.role}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <UserCog className="h-3.5 w-3.5" />
          Switch demo user
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DEMO_USERS.map((u) => {
          const active = u.id === current.id;
          return (
            <DropdownMenuItem
              key={u.id}
              onClick={() => handleSwitch(u.id)}
              className="gap-3 py-2.5"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                style={{ background: u.avatarColor }}
              >
                {u.initials}
              </div>
              <div className="flex flex-1 flex-col leading-tight">
                <span className="text-sm font-semibold">{u.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {u.role}
                </span>
              </div>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
