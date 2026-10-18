import { sb, sessionUser } from './_supabase.js';

const json = (res, status, body) => res.status(status).json(body);
const roundQty = value => Math.round((Number(value) || 0) * 1000) / 1000;
const REASONS = new Set(['Peça avariada', 'Defeito de fabricação', 'Dano no manuseio', 'Outra avaria']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Cookie');
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const session = await sessionUser(req, res);
    if (!session) return json(res, 401, { error: 'Sua sessão expirou. Entre novamente.' });
    if (!['admin', 'seller'].includes(String(session.user.role || '').toLowerCase())) {
      return json(res, 403, { error: 'Seu perfil não pode registrar baixa por avaria.' });
    }

    const body = req.body || {};
    const productId = String(body.productId || '').trim();
    const quantity = Number(body.quantity);
    const reason = String(body.reason || '').trim();
    const notes = String(body.notes || '').trim().slice(0, 1000);
    const requestId = String(body.requestId || '').trim();
    if (!productId) return json(res, 422, { error: 'Selecione um produto.' });
    if (!Number.isInteger(quantity) || quantity < 1) return json(res, 422, { error: 'Informe uma quantidade inteira maior que zero.' });
    if (!REASONS.has(reason)) return json(res, 422, { error: 'Selecione um motivo válido para a avaria.' });
    if (reason === 'Outra avaria' && !notes) return json(res, 422, { error: 'Descreva a avaria no campo de observações.' });
    if (!requestId || requestId.length > 128) return json(res, 422, { error: 'Identificador da operação inválido. Tente novamente.' });

    const read = await sb('/rest/v1/app_state?select=state,revision,updated_at&id=eq.1&limit=1', { token: session.access });
    if (!read.response.ok) return json(res, 503, { error: 'Não foi possível consultar o estoque na nuvem.' });
    const row = Array.isArray(read.data) ? read.data[0] : null;
    if (!row) return json(res, 503, { error: 'O cadastro central do sistema não foi encontrado.' });

    const currentRevision = Number(row.revision || 0);
    const current = row.state || {};
    const damages = Array.isArray(current.damages) ? current.damages : [];

    const previousRequest = damages.find(item => String(item.requestId || '') === requestId);
    if (previousRequest) return json(res, 200, { ok: true, duplicate: true, damage: previousRequest, revision: currentRevision });

    const expectedRevision = body.expectedRevision == null ? currentRevision : Number(body.expectedRevision);
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
      return json(res, 422, { error: 'Versão do estoque inválida. Atualize a tela e tente novamente.' });
    }
    if (currentRevision !== expectedRevision) {
      return json(res, 409, { error: 'O estoque foi alterado em outro dispositivo. Atualize a tela antes de registrar a avaria.', revision: currentRevision });
    }

    const products = Array.isArray(current.products) ? current.products : [];
    const product = products.find(item => String(item.id) === productId);
    if (!product) return json(res, 404, { error: 'Produto não encontrado no estoque.' });

    const stockBefore = roundQty(product.stock);
    if (stockBefore < quantity) {
      return json(res, 409, { error: 'A quantidade informada é maior que o saldo disponível.', available: stockBefore });
    }

    const now = new Date().toISOString();
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(new Date(now));
    const damage = {
      id: 'dam-' + crypto.randomUUID(),
      requestId,
      type: 'AVARIA',
      date,
      createdAt: now,
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email || 'Usuário',
      productId: String(product.id),
      productCode: String(product.code || ''),
      productName: String(product.name || 'Produto'),
      category: String(product.category || ''),
      size: String(product.size || ''),
      color: String(product.color || ''),
      quantity,
      stockBefore,
      stockAfter: roundQty(stockBefore - quantity),
      reason,
      notes
    };

    const nextState = {
      ...current,
      products: products.map(item => String(item.id) === productId ? { ...item, stock: damage.stockAfter } : item),
      damages: [...damages, damage]
    };

    const update = await sb(`/rest/v1/app_state?id=eq.1&revision=eq.${encodeURIComponent(expectedRevision)}`, {
      method: 'PATCH',
      token: session.access,
      body: { state: nextState, revision: expectedRevision + 1, updated_at: now },
      headers: { Prefer: 'return=representation' }
    });
    if (!update.response.ok) return json(res, 503, { error: 'Não foi possível gravar a baixa por avaria.' });
    if (!Array.isArray(update.data) || !update.data.length) {
      return json(res, 409, { error: 'O estoque mudou durante a operação. Atualize a tela e tente novamente.' });
    }

    // O histórico dentro de app_state é a fonte da ocorrência. O log de auditoria é complementar.
    try {
      await sb('/rest/v1/audit_logs', {
        method: 'POST',
        token: session.access,
        body: {
          actor_id: session.user.id,
          action: 'INVENTORY_DAMAGE_RECORDED',
          entity: 'product',
          entity_id: String(product.id),
          payload: {
            damageId: damage.id,
            productCode: damage.productCode,
            productName: damage.productName,
            quantity: damage.quantity,
            stockBefore: damage.stockBefore,
            stockAfter: damage.stockAfter,
            reason: damage.reason
          }
        },
        headers: { Prefer: 'return=minimal' }
      });
    } catch { /* A ocorrência já foi gravada no histórico operacional. */ }

    return json(res, 200, { ok: true, damage, revision: expectedRevision + 1 });
  } catch (error) {
    console.error('damage endpoint error', error);
    return json(res, 500, { error: 'Falha interna ao registrar a avaria.' });
  }
}
