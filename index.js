// ================= CONFIGURAÇÕES ===================
const SUPABASE_URL = 'https://wpxodnqmiiexbfleifsb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweG9kbnFtaWlleGJmbGVpZnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjcxNzIsImV4cCI6MjA2Mjg0MzE3Mn0.WZFjOC0DX5xUWzI5k150mDvu02h9RnULAwZzFFOK8OQ';
const ZAPI_INSTANCE_ID = '3E10B3ED9B50B0E3F6F5AAEF140028B5';
const ZAPI_TOKEN = '4584BFE8D86774FEC9CF4A9D';
const ZAPI_CLIENT_TOKEN = 'F68cd4b1f5bc6438295bb95043c103e39S';

// ================= DEPENDÊNCIAS ===================
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ================= FUNÇÃO PRINCIPAL ===================
async function enviarNotificacoes() {
    const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('enviado', false);

    if (error) {
        console.error('Erro ao buscar compromissos:', error);
        return;
    }

    for (const compromisso of data) {
        const agora = new Date();
        const horaCompromisso = new Date(compromisso.horario);

        if (horaCompromisso <= agora) {
            const mensagem = `Olá! Este é seu lembrete: ${compromisso.mensagem}`;

            try {
                await axios.post(`https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`, {
                    phone: compromisso.telefone,
                    message: mensagem
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Client-Token': ZAPI_CLIENT_TOKEN
                    }
                });

                await supabase
                    .from('compromissos')
                    .update({ enviado: true })
                    .eq('id', compromisso.id);

                console.log(`✅ Mensagem enviada para ${compromisso.telefone}`);
            } catch (err) {
                console.error(`❌ Erro ao enviar mensagem para ${compromisso.telefone}:`, err);
            }
        }
    }
}

// ================= EXECUÇÃO AUTOMÁTICA ===================
setInterval(enviarNotificacoes, 60 * 1000); // verifica a cada 1 minuto

// ================== COMO USAR =====================
// Rode com: node index.js
// Ele vai verificar a tabela compromissos a cada minuto e enviar lembretes que estão no horário certo
