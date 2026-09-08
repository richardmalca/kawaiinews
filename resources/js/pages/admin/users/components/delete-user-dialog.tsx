import { Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteUser } from '@/pages/admin/users/hooks/use-delete-user';
import type { AdminUser } from '@/types/admin';

type Props = {
    user: AdminUser;
};

export default function DeleteUserDialog({ user }: Props) {
    const { deleteUser, processing } = useDeleteUser(() => {});

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Estás seguro de que quieres eliminar a "{user.name}"?
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={processing}
                        onClick={() => deleteUser(user.id)}
                    >
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
