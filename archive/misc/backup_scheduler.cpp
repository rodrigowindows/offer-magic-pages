#include <iostream>
#include <string>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

// Callback para escrever resposta
size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* response) {
    size_t totalSize = size * nmemb;
    response->append((char*)contents, totalSize);
    return totalSize;
}

int main() {
    // Configurações
    const std::string SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co";
    const std::string FUNCTION_URL = SUPABASE_URL + "/functions/v1/backup-database";
    const std::string ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs";

    // Inicializar cURL
    curl_global_init(CURL_GLOBAL_DEFAULT);
    CURL* curl = curl_easy_init();

    if (curl) {
        std::string response;

        // Configurar headers
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, ("Authorization: Bearer " + ANON_KEY).c_str());

        // Configurar request
        curl_easy_setopt(curl, CURLOPT_URL, FUNCTION_URL.c_str());
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        // Body do request (backup completo)
        std::string jsonBody = R"(
        {
            "includeMetadata": true,
            "format": "json"
        })";

        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonBody.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        // Executar request
        CURLcode res = curl_easy_perform(curl);

        if (res == CURLE_OK) {
            std::cout << "✅ Backup realizado com sucesso!" << std::endl;

            // Parsear resposta JSON
            try {
                auto jsonResponse = nlohmann::json::parse(response);

                if (jsonResponse["success"]) {
                    std::cout << "📊 Total de registros: " << jsonResponse["totalRecords"] << std::endl;
                    std::cout << "📁 URL do download: " << jsonResponse["downloadUrl"] << std::endl;
                } else {
                    std::cout << "❌ Erro no backup: " << jsonResponse["error"] << std::endl;
                }
            } catch (const std::exception& e) {
                std::cout << "❌ Erro ao parsear resposta: " << e.what() << std::endl;
                std::cout << "Resposta bruta: " << response << std::endl;
            }
        } else {
            std::cout << "❌ Erro na requisição: " << curl_easy_strerror(res) << std::endl;
        }

        // Limpar
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }

    curl_global_cleanup();
    return 0;
}