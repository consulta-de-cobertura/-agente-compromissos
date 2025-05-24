// ===== DEPENDÊNCIAS =====
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// ===== CONFIGURAÇÕES =====
const supabaseUrl = 'https://wpxodnqmiiexbfleifsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweG9kbnFtaWlleGJmbGVpZnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjcxNzIsImV4cCI6MjA2Mjg0MzE3Mn0.WZFjOC0DX5xUWzI5k150mDvu02h9RnULAwZzFFOK8OQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const zApiUrl = 'https://api.z-api.io/instances/3E10B3ED9B50B0E3F6F5AAEF140028B5/token/4584BFE8D86774FEC9CF4A9D/send-text';
const zApiClientToken = 'F68cd4b1f5bc6438295bb95043c103e39S';

console.log('✅ Agente Compromissos iniciado e monitorando compromissos...');

// ===== FUNÇÃO PRINCIPAL =====
async function verificarEEnviarNotificacoes() {
  const { data, error } = await supabase
    .from('compromissos')
    .select('*')
    .eq('notificado', false);

  if (error) {
    console.error('Erro ao buscar compromissos:', error);
    return;
  }

  const agora = new Date();

  for (const compromisso of data) {
    const horaCompromisso = new Date(compromisso.horario);
    const diffMinutos = Math.floor((horaCompromisso - agora) / 60000);

    if (diffMinutos <= 5 && diffMinutos >= 0) {
      const mensagem = `🔔 Lembrete: Você tem o compromisso "${compromisso.descricao}" às ${horaCompromisso.toLocaleTimeString()}`;

      try {
        await axios.post(zApiUrl, {
          phone: compromisso.whatsapp,
          message: mensagem,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zApiClientToken,
          },
        });

        await supabase
          .from('compromissos')
          .update({ notificado: true })
          .eq('id', compromisso.id);

        console.log(`✅ Notificação enviada para ${compromisso.whatsapp}`);
      } catch (err) {
        console.error(`❌ Erro ao enviar para ${compromisso.whatsapp}:`, err.message);
      }
    }
  }
}

// ===== INTERVALO DE VERIFICAÇÃO =====
setInterval(verificarEEnviarNotificacoes, 60000);
