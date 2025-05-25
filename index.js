// ===== DEPENDÊNCIAS =====
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const express = require('express');
const app = express();
app.use(express.json());

// ===== CONFIGURAÇÕES =====
const supabaseUrl = 'https://wpxodnqmiiexbfleifsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweG9kbnFtaWlleGJmbGVpZnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjcxNzIsImV4cCI6MjA2Mjg0MzE3Mn0.WZFjOC0DX5xUWzI5k150mDvu02h9RnULAwZzFFOK8OQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const zApiUrl = 'https://api.z-api.io/instances/3E10B3ED9B50B0E3F6F5AAEF140028B5/token/4584BFE8D86774FEC9CF4A9D/send-text';
const zApiClientToken = 'F68cd4b1f5bc6438295bb95043c103e39S';

console.log('✅ Agente Compromissos iniciado e monitorando compromissos...');

// ===== FUNÇÃO PRINCIPAL =====
async function verificarEnviarNotificacoes() {
    const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('enviado', false);

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

// ===== ROTA NOVA → Receber compromisso vindo do ChatGPT =====
app.post('/registrar-compromisso', async (req, res) => {
    const { telefone, mensagem, horario } = req.body;

    if (!telefone || !mensagem || !horario) {
        return res.status(400).json({ error: 'Telefone, mensagem e horário são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('compromissos')
            .insert([
                { telefone, mensagem, horario, enviado: false }
            ]);

        if (error) {
            console.error('Erro ao salvar compromisso:', error);
            return res.status(500).json({ error: 'Erro ao salvar compromisso.' });
        }

        console.log(`✅ Novo compromisso salvo: ${mensagem} para ${telefone} em ${horario}`);
        res.json({ success: true, compromisso: data });
    } catch (err) {
        console.error('❌ Erro geral:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// ===== AJUSTE PARA RODAR NA PORTA RAILWAY =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});


