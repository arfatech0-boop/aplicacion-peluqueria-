import React, { useState } from 'react';
import { 
  Wallet, 
  DollarSign, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Plus, 
  Minus,
  FileText
} from 'lucide-react';
import { AppState, CashRegister, CashMovement } from '../types';

interface CashRegisterViewProps {
  appState: AppState;
}

export const CashRegisterView: React.FC<CashRegisterViewProps> = ({ appState }) => {
  const currentRegister = appState.cashRegisters.find(c => c.status === 'open') || appState.cashRegisters[0];

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movType, setMovType] = useState<'in' | 'out'>('out');
  const [movAmount, setMovAmount] = useState<number | ''>('');
  const [movDescription, setMovDescription] = useState('');

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isBlindCountMode, setIsBlindCountMode] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState<number | ''>('');

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRegister || !movAmount || Number(movAmount) <= 0) return;

    const amount = Number(movAmount);
    const newMov: CashMovement = {
      id: `mov-${Date.now()}`,
      type: movType,
      amount,
      description: movDescription || (movType === 'in' ? 'Ingreso manual' : 'Egreso/Gasto de caja'),
      category: movDescription.toLowerCase().includes('blindaje') || movDescription.toLowerCase().includes('retiro') ? 'withdrawal' : 'expense',
      date: new Date().toISOString(),
      paymentMethod: 'cash'
    };

    currentRegister.movements.unshift(newMov);
    if (movType === 'in') {
      currentRegister.expectedTotal += amount;
    } else {
      currentRegister.cashExpenses += amount;
      currentRegister.expectedTotal -= amount;
    }

    setIsMovementModalOpen(false);
    setMovAmount('');
    setMovDescription('');
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRegister || typeof actualCashCounted !== 'number') return;

    currentRegister.actualTotal = actualCashCounted;
    currentRegister.difference = actualCashCounted - currentRegister.expectedTotal;
    currentRegister.status = 'closed';
    currentRegister.closeDate = new Date().toISOString();

    setIsCloseModalOpen(false);
    alert(`¡Caja cerrada correctamente!\n\nMonto Contado: $${actualCashCounted.toLocaleString('es-AR')}\nDiferencia: $${currentRegister.difference.toLocaleString('es-AR')}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Control de Caja Diaria & Arqueo</h1>
          <p className="text-xs text-slate-500">Supervise apertura, ingresos de efectivo, retiros de blindaje y cierres ciegos de caja.</p>
        </div>

        {currentRegister && currentRegister.status === 'open' ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setMovType('out');
                setMovDescription('Retiro de Seguridad / Blindaje de caja');
                setIsMovementModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
            >
              <Minus className="w-4 h-4" />
              <span>Retiro Blindaje</span>
            </button>

            <button
              onClick={() => {
                setMovType('out');
                setMovDescription('');
                setIsMovementModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>+ Movimiento</span>
            </button>

            <button
              onClick={() => {
                setActualCashCounted('');
                setIsCloseModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow"
            >
              <Lock className="w-4 h-4" />
              <span>Cerrar Caja Hoy</span>
            </button>
          </div>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            Caja Cerrada
          </span>
        )}
      </div>

      {/* Main Cash Drawer Metrics */}
      {currentRegister && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Fondo Inicial de Caja</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">${currentRegister.initialAmount.toLocaleString('es-AR')}</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Ventas Efectivo Hoy</span>
            <div className="text-2xl font-bold text-emerald-600 mt-2">+${currentRegister.cashSales.toLocaleString('es-AR')}</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-red-600 uppercase">Gastos / Retiros Caja</span>
            <div className="text-2xl font-bold text-red-600 mt-2">-${currentRegister.cashExpenses.toLocaleString('es-AR')}</div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-md">
            <span className="text-xs font-semibold text-indigo-300 uppercase">Total Esperado en Caja</span>
            <div className="text-2xl font-extrabold text-white mt-2">${currentRegister.expectedTotal.toLocaleString('es-AR')}</div>
          </div>
        </div>
      )}

      {/* Cash Movements Table */}
      {currentRegister && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Movimientos del Día (Efectivo)
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRegister.movements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400">
                    No hay movimientos registrados en el turno de hoy.
                  </td>
                </tr>
              ) : (
                currentRegister.movements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500">{new Date(mov.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{mov.description}</td>
                    <td className="px-6 py-3 capitalize text-slate-600">{mov.category}</td>
                    <td className={`px-6 py-3 text-right font-bold ${mov.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mov.type === 'in' ? `+$${mov.amount.toLocaleString('es-AR')}` : `-$${mov.amount.toLocaleString('es-AR')}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Registrar Movimiento / Blindaje</h3>

            <form onSubmit={handleAddMovement} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo Movimiento</label>
                <select
                  value={movType}
                  onChange={e => setMovType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50 font-medium"
                >
                  <option value="out">Egreso / Retiro de blindaje (-)</option>
                  <option value="in">Ingreso de dinero (+)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movAmount}
                  onChange={e => setMovAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo / Descripción</label>
                <input
                  type="text"
                  required
                  value={movDescription}
                  onChange={e => setMovDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded bg-slate-50"
                  placeholder="Ej. Blindaje parcial a caja fuerte o Pago de flete"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Register Modal with Blind Count Option */}
      {isCloseModalOpen && currentRegister && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Arqueo y Cierre de Caja</h3>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBlindCountMode}
                  onChange={e => setIsBlindCountMode(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="text-[11px] font-bold text-indigo-700">Cierre Ciego</span>
              </label>
            </div>

            {!isBlindCountMode ? (
              <p className="text-slate-600">Total esperado según sistema: <span className="font-bold text-slate-900">${currentRegister.expectedTotal.toLocaleString('es-AR')}</span></p>
            ) : (
              <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-800 text-[11px]">
                🔒 <strong>Modo Cierre Ciego:</strong> Ingrese el dinero contado en billetes sin ver el total registrado por el sistema.
              </div>
            )}

            <form onSubmit={handleCloseRegister} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monto Real Contado en Billetes ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualCashCounted}
                  onChange={e => setActualCashCounted(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded bg-slate-50 font-bold text-sm text-slate-900"
                  placeholder="Ingrese importe físico..."
                />
              </div>

              {!isBlindCountMode && typeof actualCashCounted === 'number' && (
                <div className={`p-3 rounded-lg text-xs font-bold border ${
                  actualCashCounted - currentRegister.expectedTotal === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  Diferencia de Caja: ${(actualCashCounted - currentRegister.expectedTotal).toLocaleString('es-AR')}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Cerrar Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
