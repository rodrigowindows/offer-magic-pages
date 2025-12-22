import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useMarketingStore } from '@/store/marketingStore';
import { validateBatchCSV, validateRecipientInfo } from '@/utils/validators';
import type { RecipientInfo, BatchUploadResult } from '@/types/marketing.types';

export const useBatchUpload = () => {
  const store = useMarketingStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Processar arquivo CSV
  const processCSV = useCallback(
    (file: File): Promise<BatchUploadResult> => {
      return new Promise((resolve) => {
        setIsProcessing(true);

        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data;

            // Validar headers
            const headerValidation = validateBatchCSV(headers);
            if (!headerValidation.isValid) {
              toast.error(headerValidation.errors[0].message);
              setIsProcessing(false);
              resolve({
                total: 0,
                successful: 0,
                failed: 0,
                errors: [
                  {
                    row: 0,
                    recipient: {},
                    error: headerValidation.errors[0].message,
                  },
                ],
              });
              return;
            }

            // Processar linhas
            const successful: Partial<RecipientInfo>[] = [];
            const errors: BatchUploadResult['errors'] = [];

            rows.forEach((row, index) => {
              const recipient: Partial<RecipientInfo> = {
                name: row.name,
                phone_number: row.phone_number,
                email: row.email,
                address: row.address,
                seller_name: row.seller_name,
              };

              // Validar recipient
              const validation = validateRecipientInfo(recipient);

              if (validation.isValid) {
                successful.push(recipient);
              } else {
                errors.push({
                  row: index + 2, // +2 porque começa em 1 e tem header
                  recipient,
                  error: validation.errors.map((e) => e.message).join(', '),
                });
              }
            });

            // Salvar recipients válidos
            if (successful.length > 0) {
              store.setBatchRecipients(successful);
              store.setIsBatchMode(true);
              toast.success(`Loaded ${successful.length} recipients`);
            }

            if (errors.length > 0) {
              toast.warning(`${errors.length} rows had errors`);
            }

            setIsProcessing(false);

            resolve({
              total: rows.length,
              successful: successful.length,
              failed: errors.length,
              errors,
            });
          },
          error: (error) => {
            toast.error(`Failed to parse CSV: ${error.message}`);
            setIsProcessing(false);

            resolve({
              total: 0,
              successful: 0,
              failed: 0,
              errors: [
                {
                  row: 0,
                  recipient: {},
                  error: error.message,
                },
              ],
            });
          },
        });
      });
    },
    [store]
  );

  // Processar arquivo JSON
  const processJSON = useCallback(
    async (file: File): Promise<BatchUploadResult> => {
      setIsProcessing(true);

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          throw new Error('JSON must contain an array of recipients');
        }

        const successful: Partial<RecipientInfo>[] = [];
        const errors: BatchUploadResult['errors'] = [];

        data.forEach((item, index) => {
          const recipient: Partial<RecipientInfo> = {
            name: item.name,
            phone_number: item.phone_number,
            email: item.email,
            address: item.address,
            seller_name: item.seller_name,
          };

          const validation = validateRecipientInfo(recipient);

          if (validation.isValid) {
            successful.push(recipient);
          } else {
            errors.push({
              row: index + 1,
              recipient,
              error: validation.errors.map((e) => e.message).join(', '),
            });
          }
        });

        if (successful.length > 0) {
          store.setBatchRecipients(successful);
          store.setIsBatchMode(true);
          toast.success(`Loaded ${successful.length} recipients`);
        }

        if (errors.length > 0) {
          toast.warning(`${errors.length} items had errors`);
        }

        setIsProcessing(false);

        return {
          total: data.length,
          successful: successful.length,
          failed: errors.length,
          errors,
        };
      } catch (error: any) {
        toast.error(`Failed to parse JSON: ${error.message}`);
        setIsProcessing(false);

        return {
          total: 0,
          successful: 0,
          failed: 0,
          errors: [
            {
              row: 0,
              recipient: {},
              error: error.message,
            },
          ],
        };
      }
    },
    [store]
  );

  // Processar arquivo genérico
  const processFile = useCallback(
    async (file: File): Promise<BatchUploadResult> => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        return processCSV(file);
      } else if (fileExtension === 'json') {
        return processJSON(file);
      } else {
        toast.error('Unsupported file format. Please use CSV or JSON.');
        return {
          total: 0,
          successful: 0,
          failed: 0,
          errors: [
            {
              row: 0,
              recipient: {},
              error: 'Unsupported file format',
            },
          ],
        };
      }
    },
    [processCSV, processJSON]
  );

  // Limpar batch
  const clearBatch = useCallback(() => {
    store.setBatchRecipients([]);
    store.setIsBatchMode(false);
    toast.info('Batch cleared');
  }, [store]);

  // Gerar template CSV
  const generateCSVTemplate = useCallback(() => {
    const headers = ['name', 'phone_number', 'email', 'address', 'seller_name'];
    const sampleRow = [
      'John Smith',
      '7865551234',
      'john@example.com',
      '123 Main St, Miami, FL',
      'Michael',
    ];

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'batch_template.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Template downloaded');
  }, []);

  return {
    // Estado
    isProcessing,
    batchRecipients: store.wizard.batchRecipients,
    isBatchMode: store.wizard.isBatchMode,

    // Ações
    processFile,
    processCSV,
    processJSON,
    clearBatch,
    generateCSVTemplate,
  };
};

export default useBatchUpload;
