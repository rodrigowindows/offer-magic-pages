import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, Download, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarketingStore } from '@/store/marketingStore';
import { useBatchUpload } from '@/hooks/useBatchUpload';
import { recipientInfoSchema } from '@/utils/validators';
import { formatPhone } from '@/utils/formatters';
import type { RecipientInfo } from '@/types/marketing.types';

export function Step1RecipientInfo() {
  const store = useMarketingStore();
  const { processFile, clearBatch, generateCSVTemplate, isBatchMode, batchRecipients } = useBatchUpload();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RecipientInfo>({
    resolver: zodResolver(recipientInfoSchema),
    defaultValues: store.wizard.recipientInfo,
  });

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await processFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    multiple: false,
  });

  const onSubmit = (data: RecipientInfo) => {
    store.setRecipientInfo(data);
    store.nextStep();
  };

  const phoneValue = watch('phone_number');

  return (
    <div className="space-y-6">
      {/* Modo Individual */}
      {!isBatchMode && (
        <Card>
          <CardHeader>
            <CardTitle>Recipient Information</CardTitle>
            <CardDescription>Enter the property owner's contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="John Smith"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone_number">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone_number"
                  {...register('phone_number')}
                  placeholder="7865551234 (10 digits)"
                  maxLength={10}
                  className={errors.phone_number ? 'border-red-500' : ''}
                />
                {phoneValue && phoneValue.length === 10 && (
                  <p className="text-sm text-muted-foreground">
                    Format: {formatPhone(phoneValue)}
                  </p>
                )}
                {errors.phone_number && (
                  <p className="text-sm text-red-500">{errors.phone_number.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Property Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="123 Main St, Miami, FL 33139"
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              {/* Seller Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="seller_name">Seller/Agent Name (Optional)</Label>
                <Input
                  id="seller_name"
                  {...register('seller_name')}
                  placeholder="Michael Johnson"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => store.setIsBatchMode(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Switch to Batch Mode
                </Button>
                <Button type="submit">Next Step</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Modo Batch */}
      {isBatchMode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Batch Upload</CardTitle>
                <CardDescription>Upload CSV or JSON file with multiple recipients</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={clearBatch}>
                <X className="w-4 h-4 mr-2" />
                Clear & Switch to Individual
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropzone */}
            {batchRecipients.length === 0 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop file here'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to select file
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, JSON
                </p>
              </div>
            )}

            {/* Lista de Recipients */}
            {batchRecipients.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {batchRecipients.length} recipients loaded
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ready to send communications
                    </p>
                  </div>
                  <Badge variant="secondary">{batchRecipients.length} total</Badge>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Phone</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRecipients.map((recipient, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{recipient.name}</td>
                          <td className="px-3 py-2">
                            {recipient.phone_number && formatPhone(recipient.phone_number)}
                          </td>
                          <td className="px-3 py-2">{recipient.email}</td>
                          <td className="px-3 py-2 truncate max-w-xs">
                            {recipient.address}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCSVTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button onClick={() => store.nextStep()}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Download Template */}
            {batchRecipients.length === 0 && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={generateCSVTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Step1RecipientInfo;
