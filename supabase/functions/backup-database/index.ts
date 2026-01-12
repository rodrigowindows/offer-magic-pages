import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BackupRequest {
  tables?: string[]
  format?: 'json' | 'csv'
  includeMetadata?: boolean
}

interface BackupResponse {
  success: boolean
  timestamp: string
  tables: Record<string, { records: number; size: number }>
  totalRecords: number
  totalSize: number
  downloadUrl?: string
  error?: string
}

const TABLES = [
  'priority_leads',
  'property_notes',
  'call_settings',
  'properties',
  'ab_tests',
  'campaign_templates',
  'profiles',
  'ab_test_events',
  'campaign_sequences',
  'email_campaigns',
  'email_settings',
  'property_leads',
  'sms_settings',
  'follow_up_reminders',
  'property_analytics',
  'sequence_steps',
  'property_sequences',
  'notifications',
  'campaign_logs'
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { tables = TABLES, format = 'json', includeMetadata = true }: BackupRequest =
      req.method === 'POST' ? await req.json() : {}

    console.log(`Starting backup for ${tables.length} tables in ${format} format`)

    const backupData: Record<string, any[]> = {}
    const tableStats: Record<string, { records: number; size: number }> = {}
    let totalRecords = 0
    let totalSize = 0

    // Backup each table
    for (const tableName of tables) {
      try {
        console.log(`Backing up table: ${tableName}`)

        const { data, error, count } = await supabaseClient
          .from(tableName)
          .select('*', { count: 'exact' })

        if (error) {
          console.error(`Error backing up ${tableName}:`, error)
          tableStats[tableName] = { records: 0, size: 0 }
          continue
        }

        backupData[tableName] = data || []
        const dataSize = JSON.stringify(data).length

        tableStats[tableName] = {
          records: count || data?.length || 0,
          size: dataSize
        }

        totalRecords += count || data?.length || 0
        totalSize += dataSize

        console.log(`✅ ${tableName}: ${count || data?.length || 0} records (${dataSize} bytes)`)

      } catch (err) {
        console.error(`Unexpected error backing up ${tableName}:`, err)
        tableStats[tableName] = { records: 0, size: 0 }
      }
    }

    // Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${timestamp}.${format}`

    let fileContent: string
    let contentType: string

    if (format === 'csv') {
      // Convert to CSV format (simplified - assumes first table has structure)
      const firstTable = Object.keys(backupData)[0]
      if (firstTable && backupData[firstTable].length > 0) {
        const headers = Object.keys(backupData[firstTable][0]).join(',')
        const rows = backupData[firstTable].map(row =>
          Object.values(row).map(val =>
            typeof val === 'object' ? JSON.stringify(val) : String(val)
          ).join(',')
        )
        fileContent = [headers, ...rows].join('\n')
      } else {
        fileContent = 'No data available'
      }
      contentType = 'text/csv'
    } else {
      // JSON format
      const backupObject = {
        metadata: includeMetadata ? {
          timestamp: new Date().toISOString(),
          totalRecords,
          totalSize,
          tables: tableStats,
          format: 'json'
        } : undefined,
        data: backupData
      }
      fileContent = JSON.stringify(backupObject, null, 2)
      contentType = 'application/json'
    }

    // Upload backup file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('backups')
      .upload(fileName, fileContent, {
        contentType,
        upsert: false
      })

    let downloadUrl: string | undefined
    if (!uploadError) {
      const { data: urlData } = supabaseClient.storage
        .from('backups')
        .getPublicUrl(fileName)
      downloadUrl = urlData.publicUrl
    }

    const response: BackupResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      tables: tableStats,
      totalRecords,
      totalSize,
      downloadUrl,
    }

    console.log(`Backup completed: ${totalRecords} records, ${totalSize} bytes`)

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Backup failed:', error)

    const errorResponse: BackupResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      tables: {},
      totalRecords: 0,
      totalSize: 0,
      error: error.message
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})