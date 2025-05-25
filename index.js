require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
app.use(express.json());

// CONFIGURAÇÕES
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const zApiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`;
const zApiClientToken = process.env.ZAPI_CLIENT_TOKEN;

console.log('✅ Agente Zap iniciado e monitorando compromissos...');

// FUNÇÃO PRINCIPAL: VERIFICAR E ENVIAR NOTIFICAÇÕES
async function verificarEnviarNotificacoes() {
    const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('enviado', false);

    if (error) {
        console.error('❌ Erro ao buscar compromissos:', error);
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

// INTERVALO DE VERIFICAÇÃO A CADA 1 MINUTO
setInterval(verificarEnviarNotificacoes, 60000);

// SERVIDOR PARA MANTER O RAILWAY VIVO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
