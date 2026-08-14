import { ControlPopup } from '../../_components/controllist/controls/layout';

import { MonsterSetCatalog } from './MonsterSetCatalog';

export const MonsterImportPopup = () =>
    <ControlPopup
        param="importMonsters"
        label="5etools"
        triggerVariant="outline-primary"
        triggerSize="sm"
        content={<MonsterSetCatalog />}
    />;
