import { PowerOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBulkToggleNewsSources } from '@/pages/admin/news-sources/hooks/use-bulk-toggle-news-sources';

export default function NewsSourceBulkActions() {
    const { activateAllSources, deactivateAllSources, processing } =
        useBulkToggleNewsSources();

    return (
        <div className="flex gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={processing}
                onClick={activateAllSources}
            >
                <Zap />
                Activar todas
            </Button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={processing}
                onClick={deactivateAllSources}
            >
                <PowerOff />
                Desactivar todas
            </Button>
        </div>
    );
}
