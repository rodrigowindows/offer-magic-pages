import { supabase } from "@/integrations/supabase/client";
import { analyzePropertyWithAI, savePropertyAnalysis } from "./aiPropertyAnalyzer";
import { checkAndSaveAirbnbEligibility } from "./airbnbChecker";
import { autoTagProperty } from "./autoTagger";

export interface OrlandoLead {
  PID: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  score?: number;
  owner_name?: string;
  owner_address?: string;
  owner_phone?: string;
  owner_email?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  deed_certified?: boolean;
  vacant?: boolean;
  has_pool?: boolean;
  owner_out_of_state?: boolean;
  is_estate?: boolean;
  equity_percentage?: number;
  [key: string]: any; // Allow other fields from CSV
}

export interface BulkImportOptions {
  runAIAnalysis?: boolean;
  checkAirbnb?: boolean;
  autoTag?: boolean;
  uploadImages?: boolean;
  importBatchName?: string;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  analyzed: number;
  tagged: number;
  airbnbChecked: number;
  imagesUploaded: number;
  errors: string[];
  propertyIds: string[];
}

/**
 * Bulk import Orlando leads from ULTIMATE_FINAL_LEADS.csv
 */
export const bulkImportOrlandoLeads = async (
  leads: OrlandoLead[],
  userId: string,
  userName: string,
  options: BulkImportOptions = {}
): Promise<BulkImportResult> => {
  const {
    runAIAnalysis = true,
    checkAirbnb = true,
    autoTag = true,
    uploadImages = false,
    importBatchName = `Orlando-${new Date().toISOString().split('T')[0]}`,
  } = options;

  const result: BulkImportResult = {
    success: false,
    imported: 0,
    analyzed: 0,
    tagged: 0,
    airbnbChecked: 0,
    imagesUploaded: 0,
    errors: [],
    propertyIds: [],
  };

  for (const lead of leads) {
    try {
      // 1. Generate slug for property
      const slug = generateSlug(lead.address, lead.city);

      // 2. Auto-tag based on score and characteristics
      let tags: string[] = [];
      if (autoTag) {
        tags = autoTagProperty({
          score: lead.score || 0,
          deed_certified: lead.deed_certified || false,
          vacant: lead.vacant || false,
          has_pool: lead.has_pool || false,
          owner_out_of_state: lead.owner_out_of_state || false,
          is_estate: lead.is_estate || false,
          equity_percentage: lead.equity_percentage || 0,
        });
      }

      // 3. Insert property into database
      const { data: property, error: insertError } = await supabase
        .from("properties")
        .insert({
          slug,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          zip_code: lead.zip_code,
          estimated_value: lead.estimated_value,
          cash_offer_amount: lead.cash_offer_amount,
          owner_name: lead.owner_name,
          owner_address: lead.owner_address,
          owner_phone: lead.owner_phone,
          property_type: lead.property_type,
          bedrooms: lead.bedrooms,
          bathrooms: lead.bathrooms,
          square_feet: lead.square_feet,
          year_built: lead.year_built,
          tags: tags,
          import_batch: importBatchName,
          import_date: new Date().toISOString().split('T')[0],
          approval_status: "pending",
          lead_status: "new",
          status: "active",
          created_by: userId,
          created_by_name: userName,
          // Store PID and score in custom fields
          origem: lead.PID, // Store PID in 'origem' field
          focar: lead.score?.toString(), // Store score in 'focar' field
        })
        .select()
        .single();

      if (insertError) {
        result.errors.push(`Failed to import ${lead.address}: ${insertError.message}`);
        continue;
      }

      result.imported++;
      result.propertyIds.push(property.id);

      if (autoTag) {
        result.tagged++;
      }

      // 4. Run AI analysis (if enabled)
      if (runAIAnalysis) {
        try {
          const analysis = await analyzePropertyWithAI(
            lead.address,
            lead.city,
            lead.state,
            lead.zip_code,
            lead.estimated_value,
            lead.cash_offer_amount,
            lead.property_type,
            lead.bedrooms,
            lead.bathrooms,
            lead.square_feet,
            lead.year_built
          );

          await savePropertyAnalysis(property.id, analysis);
          result.analyzed++;
        } catch (error) {
          result.errors.push(`AI analysis failed for ${lead.address}: ${error}`);
        }
      }

      // 5. Check Airbnb eligibility (if enabled)
      if (checkAirbnb) {
        try {
          await checkAndSaveAirbnbEligibility(property.id);
          result.airbnbChecked++;
        } catch (error) {
          result.errors.push(`Airbnb check failed for ${lead.address}: ${error}`);
        }
      }

      // 6. Upload image (if enabled and image exists)
      if (uploadImages) {
        try {
          const imageUploaded = await uploadPropertyImage(property.id, lead.PID);
          if (imageUploaded) {
            result.imagesUploaded++;
          }
        } catch (error) {
          // Image upload errors are non-critical, just log
          console.log(`Image upload skipped for ${lead.address}`);
        }
      }

      // Add delay to avoid rate limiting (especially for AI and Airbnb checks)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error: any) {
      result.errors.push(`Failed to process ${lead.address}: ${error.message}`);
    }
  }

  result.success = result.imported > 0;
  return result;
};

/**
 * Generate URL-friendly slug for property
 */
const generateSlug = (address: string, city: string): string => {
  const text = `${address}-${city}`;
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100); // Limit length
};

/**
 * Upload property image from Step 3 images folder
 */
const uploadPropertyImage = async (
  propertyId: string,
  pid: string
): Promise<boolean> => {
  try {
    // Image would be in: Step 3/property_images/{PID}.jpg
    // For now, just return false as images need to be uploaded via the upload_images.py script
    // This is a placeholder for future client-side image upload
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Parse CSV file content to Orlando leads
 */
export const parseOrlandoLeadsCSV = (csvContent: string): OrlandoLead[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  // Parse rows
  const leads: OrlandoLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Skipping line ${i + 1}: column count mismatch`);
      continue;
    }

    const lead: any = {};
    headers.forEach((header, index) => {
      const value = values[index].trim().replace(/"/g, '');

      // Map common fields
      switch (header.toLowerCase()) {
        case 'pid':
        case 'parcel_id':
          lead.PID = value;
          break;
        case 'address':
        case 'property_address':
        case 'situs_address':
          lead.address = value;
          break;
        case 'city':
          lead.city = value || 'Orlando';
          break;
        case 'state':
          lead.state = value || 'FL';
          break;
        case 'zip':
        case 'zip_code':
        case 'zipcode':
          lead.zip_code = value;
          break;
        case 'estimated_value':
        case 'assessed_value':
        case 'market_value':
          lead.estimated_value = parseFloat(value) || 0;
          break;
        case 'cash_offer':
        case 'cash_offer_amount':
        case 'offer_amount':
          lead.cash_offer_amount = parseFloat(value) || 0;
          break;
        case 'score':
        case 'rank':
        case 'final_score':
          lead.score = parseFloat(value) || 0;
          break;
        case 'owner_name':
        case 'owner':
          lead.owner_name = value;
          break;
        case 'owner_address':
        case 'mailing_address':
          lead.owner_address = value;
          break;
        case 'owner_phone':
        case 'phone':
          lead.owner_phone = value;
          break;
        case 'bedrooms':
        case 'beds':
          lead.bedrooms = parseInt(value) || undefined;
          break;
        case 'bathrooms':
        case 'baths':
          lead.bathrooms = parseFloat(value) || undefined;
          break;
        case 'square_feet':
        case 'sqft':
        case 'living_area':
          lead.square_feet = parseInt(value) || undefined;
          break;
        case 'year_built':
          lead.year_built = parseInt(value) || undefined;
          break;
        case 'deed_certified':
          lead.deed_certified = value.toLowerCase() === 'true' || value === '1';
          break;
        case 'vacant':
          lead.vacant = value.toLowerCase() === 'true' || value === '1';
          break;
        default:
          // Store other fields as-is
          lead[header] = value;
      }
    });

    // Validate required fields
    if (lead.address && lead.city && lead.estimated_value > 0) {
      // Calculate cash offer if not provided (70% of estimated value)
      if (!lead.cash_offer_amount) {
        lead.cash_offer_amount = Math.round(lead.estimated_value * 0.70);
      }

      leads.push(lead as OrlandoLead);
    } else {
      console.warn(`Skipping line ${i + 1}: missing required fields`);
    }
  }

  return leads;
};

/**
 * Parse CSV line handling quoted values with commas
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

/**
 * Read CSV file from file input
 */
export const readCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
