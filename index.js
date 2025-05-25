// ===== DEPENDÊNCIAS =====
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const supabaseUrl = 'https://wpxodnqmiiexbfleifsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // (sua chave completa)
const supabase = createClient(supabaseUrl, supabaseKey);

const zApiUrl = 'https://api.z-api.io/instances/3E10B3ED9B50B0E3F6F5AAEF140028B5/token/4584BFE8D86774FEC9CF4A9D/send-text';
const zApiClientToken = 'F68cd4b1f5bc6438295bb95043c103e39S';

console.log('✅ Agente Compromissos iniciado e monitorando compromissos...');

// ===== FUNÇÃO PRINCIPAL =====
async function verificarEnviarNotificacoes() {
    const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('enviado', false);  // <<< COLUNA CORRIGIDA

    if (error) {
        console.error('Erro ao buscar compromissos:', error);
        return;
    }

    const agora = new Date();

    for (const compromisso of data) {
        const horarioCompromisso = new Date(compromisso.horario);
        const diferencaMinutos = (horarioCompromisso - agora) / (1000 * 60);

        if (diferencaMinutos <= 60 && diferencaMinutos > 0) {
            const mensagem = `🔔 Lembrete: ${compromisso.mensagem}`;

            try {
                await axios.post(zApiUrl, {
                    phone: compromisso.telefone,
                    message: mensagem
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Client-Token': zApiClientToken
                    }
                });

                await supabase
                    .from('compromissos')
                    .update({ enviado: true })
                    .eq('id', compromisso.id);

                console.log(`✅ Notificação enviada para ${compromisso.telefone}: ${compromisso.mensagem}`);
            } catch (err) {
                console.error(`❌ Erro ao enviar notificação para ${compromisso.telefone}:`, err.message);
            }
        }
    }
}

// ===== INTERVALO DE VERIFICAÇÃO =====
setInterval(verificarEnviarNotificacoes, 60000); // a cada 1 minuto

