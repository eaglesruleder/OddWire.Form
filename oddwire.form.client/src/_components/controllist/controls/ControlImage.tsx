import type { CoreControlProps } from './controlTypes';

import { ControlBase } from './ControlBase';

// Intent: static image display — value is a URL/URN loaded into an <img>; capture/upload is future work
export const ControlImage = (props: CoreControlProps<string>) =>
    <ControlBase {...props} stacked>
        {props.value
        ?   <img src={props.value} alt={props.label ?? props.param} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
        :   <span className="text-muted">{props.placeholder ?? 'No image'}</span>
        }
    </ControlBase>;
