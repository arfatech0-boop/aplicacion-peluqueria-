import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  FileSpreadsheet, 
  FileText, 
  Award,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { AppState } from '../types';
import { generateMonthlyReportPDF } from '../utils/pdfGenerator';
import { exportSalesExcel } from '../utils/excelExporter';
import { Pagination } from './Pagination';

interface ReportsViewProps {
  appState: AppState;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ appState }) => {
  const months = [
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' }
  ];

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Filter Sales for selected month/year
  const completedSales = appState.sales.filter(s => {
    if (s.status !== 'completed') return false;
    const d = new Date(s.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);

  let totalCost = 0;
  const productPerformanceMap = new Map<string, { id: string; name: string; category: string; qty: number; revenue: number; cost: number }>();
  const categoryPerformanceMap = new Map<string, number>();

  completedSales.forEach(s => {
    s.items.forEach(item => {
      const itemCost = (item.costPrice || 0) * item.quantity;
      totalCost += itemCost;

      // Product grouping
      const currentProd = productPerformanceMap.get(item.productId) || {
        id: item.productId,
        name: item.productName,
        category: 'General',
        qty: 0,
        revenue: 0,
        cost: 0
      };

      const prodObj = appState.products.find(p => p.id === item.productId);
      if (prodObj) currentProd.category = prodObj.category;

      currentProd.qty += item.quantity;
      currentProd.revenue += item.subtotal;
      currentProd.cost += itemCost;
      productPerformanceMap.set(item.productId, currentProd);

      // Category grouping
      const catName = currentProd.category;
      categoryPerformanceMap.set(catName, (categoryPerformanceMap.get(catName) || 0) + item.subtotal);
    });
  });

  const grossProfit = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const [rankingPage, setRankingPage] = useState(1);
  const [rankingPageSize, setRankingPageSize] = useState(10);

  const productRanking = Array.from(productPerformanceMap.values()).sort((a, b) => b.revenue - a.revenue);
  const paginatedRanking = productRanking.slice(
    (rankingPage - 1) * rankingPageSize,
    rankingPage * rankingPageSize
  );

  // Chart data
  const chartData = productRanking.slice(0, 8).map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
    Ventas: p.revenue,
    Unidades: p.qty
  }));

  const categoryChartData = Array.from(categoryPerformanceMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
  const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes Mensuales y Rendimiento por Producto</h1>
          <p className="text-xs text-slate-500">Estadísticas avanzadas de rotación de stock, rentabilidad y ventas por producto.</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Month / Year selector */}
          <select
            value={selectedMonth}
            onChange={e => {
              setSelectedMonth(Number(e.target.value));
              setRankingPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => {
              setSelectedYear(Number(e.target.value));
              setRankingPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <button
            onClick={() => generateMonthlyReportPDF(monthLabel, selectedYear, appState.sales, appState.products, appState.storeInfo)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar Reporte PDF</span>
          </button>
        </div>
      </div>

      {/* Monthly KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Facturación Total del Mes</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">${totalRevenue.toLocaleString('es-AR')}</div>
          <span className="text-xs text-slate-500 block mt-1">{completedSales.length} ventas completadas</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Costo Total Mercadería</span>
          <div className="text-2xl font-bold text-slate-700 mt-2">${totalCost.toLocaleString('es-AR')}</div>
          <span className="text-xs text-slate-500 block mt-1">Costo de reposición estimado</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Ganancia Bruta Estimada</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">${grossProfit.toLocaleString('es-AR')}</div>
          <span className="text-xs text-emerald-600 font-bold block mt-1">Margen global: +{marginPercentage}%</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 uppercase">Top Producto Estrella</span>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {productRanking[0]?.name || 'Sin ventas en el período'}
          </div>
          <span className="text-xs text-indigo-600 font-medium block mt-1">
            {productRanking[0] ? `${productRanking[0].qty} unidades vendidas` : '-'}
          </span>
        </div>
      </div>

      {/* Visual Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart Sales per Product (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Rendimiento por Producto (Top Ventas en $)</h3>
            <span className="text-xs text-slate-500">{monthLabel} {selectedYear}</span>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No hay ventas registradas para este mes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Ingresos']} />
                  <Bar dataKey="Ventas" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Distribución por Categoría</h3>

          <div className="h-56 w-full">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Sin datos de categoría.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `$${val.toLocaleString('es-AR')}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t text-xs">
            {categoryChartData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <span className="font-bold">${cat.value.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Product Ranking Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
          <span>Ranking Detallado de Ventas por Producto</span>
          <span className="text-xs text-slate-500">Ordenado por facturación total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Posición</th>
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3 text-center">Cant. Vendida</th>
                <th className="px-6 py-3 text-right">Facturación ($)</th>
                <th className="px-6 py-3 text-right">Ganancia Est. ($)</th>
                <th className="px-6 py-3 text-right">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productRanking.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se registran productos vendidos en el mes seleccionado.
                  </td>
                </tr>
              ) : (
                paginatedRanking.map((prod, index) => {
                  const prodProfit = prod.revenue - prod.cost;
                  const pct = totalRevenue > 0 ? ((prod.revenue / totalRevenue) * 100).toFixed(1) : '0';
                  const position = (rankingPage - 1) * rankingPageSize + index + 1;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-slate-400">#{position}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">{prod.name}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {prod.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-indigo-600">{prod.qty}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900">${prod.revenue.toLocaleString('es-AR')}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-emerald-600">${prodProfit.toLocaleString('es-AR')}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-600">{pct}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={rankingPage}
          totalItems={productRanking.length}
          pageSize={rankingPageSize}
          onPageChange={setRankingPage}
          onPageSizeChange={setRankingPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="productos"
        />
      </div>
    </div>
  );
};
