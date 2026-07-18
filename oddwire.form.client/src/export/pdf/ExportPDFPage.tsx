import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ControlError } from '../../_components/controllist';
import { StripLayout } from '../../_components/layout';
import { FormContext, InstanceContext, InstanceEntity, PdfTemplateContext, FormImageContext } from '../../_context';
import type { FormDefinition } from '../../_context';
import { FormPdfExporter } from '../FormPdfExporter';

import { downloadBlob } from './downloadBlob';
import './exportPdfPage.css';

export function ExportPDFPage()
{
    const { formId = '', instanceId = '' } = useParams();
    const { getForm } = useContext(FormContext);
    const { getInstance } = useContext(InstanceContext);
    const { getTemplate } = useContext(PdfTemplateContext);
    const images = useContext(FormImageContext);

    const [form, setForm] = useState<FormDefinition | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        document.body.classList.add('pdf-export-route');

        return () => { document.body.classList.remove('pdf-export-route'); };
    }, []);

    useEffect(() =>
    {
        let active = true;

        (async () =>
        {
            setLoading(true);
            setError(undefined);
            setBlob(null);

            try
            {
                const loadedForm = await getForm(formId);
                const loadedInstance = await getInstance(instanceId);

                if (!loadedForm)
                    throw new Error('Form Not Found');

                if (!loadedInstance)
                    throw new Error('Instance Not Found');

                const template = await getTemplate(loadedForm.formId);
                const exported = await new FormPdfExporter(loadedForm, InstanceEntity.from(loadedInstance), template, images).export();

                if (active)
                {
                    setForm(loadedForm);
                    setBlob(exported);
                }
            }
            catch (err)
            {
                if (active)
                    setError(err instanceof Error ? err.message : 'PDF export failed');
            }
            finally
            {
                if (active)
                    setLoading(false);
            }
        })();

        return () => { active = false; };
    }, [formId, instanceId, getForm, getInstance, getTemplate, images]);

    const url = useMemo(() =>
    {
        if (!blob)
            return undefined;

        return URL.createObjectURL(blob);
    }, [blob]);

    useEffect(() => () =>
    {
        if (url)
            URL.revokeObjectURL(url);
    }, [url]);

    const backLink = `/form/${formId}/${instanceId}`;
    const fileName = `${form?.label ?? 'form'}.pdf`;
    const download =
        <button
            type="button"
            className="strip-btn"
            title="Download PDF"
            disabled={!blob}
            onClick={() => blob && downloadBlob(blob, fileName)}
        >⇩</button>;

    return (
        <StripLayout left="←" leftLink={backLink} right={download} title={form?.label ?? 'Export PDF'}>
            {loading &&
                <div className="center">Preparing PDF...</div>
            }
            {error &&
                <ControlError>{error}</ControlError>
            }
            {url &&
                <iframe className="pdf-preview" src={url} title={fileName} />
            }
        </StripLayout>
        );
}
