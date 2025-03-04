import { FC } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Contact } from "@/store/store";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";

interface DrawerProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  contacts: Contact[];
  children: React.ReactNode;
}

const Drawer: FC<DrawerProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  children,
}) => {
  return (
    <div>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full px-0">
          <SheetHeader>
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>

          <div className="w-full space-y-2">{children}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Drawer;
