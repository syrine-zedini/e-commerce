import React, { useEffect, useRef, useState } from 'react';
import { apiGet, fetchAllProducts } from '@/lib/api';
import { Line, Doughnut } from 'react-chartjs-2';
import { BarChart3, Download, FileText, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import autoTable from 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const getStock = (p: any): number | null => {
  if (p.form === null || p.form === undefined || p.form === '') return null;
  const n = Number(p.form);
  return isNaN(n) ? null : n;
};

export const ReportsAnalytics: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState<'sales' | 'products' | 'customers' | 'orders'>('sales');
  const [filterNew, setFilterNew] = useState(false);
  const [filterPopular, setFilterPopular] = useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);

  const salesChartRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    const data = await apiGet('/api/commandes');
    const start = dateRange.start;
    const end = dateRange.end;
    const filtered = (data || []).filter((o: any) => {
      const createdAt = String(o.created_at || '');
      return createdAt >= start && createdAt <= end;
    });
    setOrders(filtered);
  };
  const fetchProducts = async () => {
    const data = await fetchAllProducts('/api/products');
    setProducts(data);
  };
  useEffect(() => { fetchOrders(); fetchProducts(); }, [dateRange]);

  const nouveauProducts = products.filter(p => p.new);
  const populaireProducts = products.filter(p => p.popular);
  const outOfStockProducts = products.filter(p => p.stock_status === 'en rupture de stock');
  const inStockProducts = products.filter(p => p.stock_status === 'en stock');

  const noFilter = !filterNew && !filterPopular && !filterOutOfStock && !filterInStock;
  const filteredProducts = noFilter ? products : products.filter(p => {
    if (filterNew && p.new) return true;
    if (filterPopular && p.popular) return true;
    if (filterOutOfStock && p.stock_status === 'en rupture de stock') return true;
    if (filterInStock && p.stock_status === 'en stock') return true;
    return false;
  });

  const salesData = {
    labels: orders.map(o => new Date(o.created_at).toLocaleDateString('fr-FR')),
    datasets: [{
      label: 'Ventes (TND)',
      data: orders.map(o => o.total),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.2)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6',
    }],
  };

  const orderStatusData = {
    labels: ['En attente', 'Pre-confirme', 'Confirme', 'Livre', 'Annule'],
    datasets: [{
      data: ['pending', 'preconfirmed', 'confirmed', 'delivered', 'cancelled'].map(
        s => orders.filter(o => o.statut === s).length
      ),
      backgroundColor: ['#f59e0b', '#f97316', '#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' as const } } };

  const handleGenerateReport = () => {
    setReports(prev => [{
      id: crypto.randomUUID(),
      title: `Rapport ${reportType === 'sales' ? 'Ventes' : reportType === 'products' ? 'Produits' : reportType === 'customers' ? 'Clients' : 'Commandes'}`,
      dateRange: { ...dateRange },
      generatedAt: new Date(),
    }, ...prev]);
  };

  const generateProductReportPDF = async () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    try {
      const res = await fetch('/figmaAssets/brand/glow-store-logo.jpeg');
      const blob = await res.blob();
      const reader = new FileReader();
      await new Promise<void>(resolve => {
        reader.onload = () => { doc.addImage(reader.result as string, 'JPEG', 14, 10, 38, 18); resolve(); };
        reader.readAsDataURL(blob);
      });
    } catch {}

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(184, 134, 11);
    doc.text('RAPPORT PRODUITS', pageW - 14, 20, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, pageW - 14, 27, { align: 'right' });

    const activeFilters = [filterNew && 'Nouveau', filterPopular && 'Populaire', filterOutOfStock && 'En rupture', filterInStock && 'En stock'].filter(Boolean);
    doc.text(`Filtres : ${activeFilters.length > 0 ? activeFilters.join(', ') : 'Tous les produits'}`, pageW - 14, 33, { align: 'right' });

    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(0.5);
    doc.line(14, 36, pageW - 14, 36);

    // KPI summary line
    let y = 44;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40);
    doc.text(`Total : ${products.length}`, 14, y);
    doc.text(`Nouveaux : ${nouveauProducts.length}`, 50, y);
    doc.text(`Populaires : ${populaireProducts.length}`, 95, y);
    doc.text(`En stock : ${inStockProducts.length}`, 140, y);
    doc.text(`En rupture : ${outOfStockProducts.length}`, 180, y);
    y += 8;

    const rows = filteredProducts.map(p => {
      const priceTTC = Number(p.discounted_price || p.original_price || 0);
      const tvaRate = Number(p.tva || p.discount_percentage || 0);
      const tvaCoeff = tvaRate / (100 + tvaRate);
      const tvaAmount = tvaRate > 0 ? priceTTC * tvaCoeff : 0;
      const priceHT = priceTTC - tvaAmount;
      const stock = getStock(p);
      const tags = [p.new && 'Nouveau', p.popular && 'Populaire'].filter(Boolean).join(', ') || '-';
      const statut = p.stock_status === 'en rupture de stock' ? 'Rupture' : 'En stock';
      return [
        p.name || '-',
        p.category || '-',
        `${priceHT.toFixed(3)} TND`,
        `${tvaRate}% (${tvaAmount.toFixed(3)})`,
        `${priceTTC.toFixed(3)} TND`,
        stock !== null ? String(stock) : 'N/A',
        statut,
        tags,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Nom', 'Categorie', 'Prix HT', 'TVA', 'Prix TTC', 'Stock', 'Statut', 'Tags']],
      body: rows,
      headStyles: { fillColor: [184, 134, 11], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.5, textColor: 50 },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 24 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 13, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('YJ PARA - Rapport genere automatiquement', pageW / 2, finalY, { align: 'center' });

    doc.save(`rapport-produits-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generatePDF = async (report: any, download = false) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(16);
    doc.text(report.title, 40, 40);
    doc.setFontSize(12);
    doc.text(`Periode : ${report.dateRange.start} - ${report.dateRange.end}`, 40, 60);
    doc.text(`Genere le : ${new Date(report.generatedAt).toLocaleDateString('fr-FR')}`, 40, 80);

    let yOffset = 100;
    const orderRows = orders.map((o, index) => [
      index + 1, `${o.nom} ${o.prenom}`, o.email, o.phone, o.ville, o.paiement_mode, o.statut, o.total,
    ]);
    autoTable(doc, {
      startY: yOffset,
      head: [['#', 'Nom', 'Email', 'Tel', 'Ville', 'Paiement', 'Statut', 'Total']],
      body: orderRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });
    yOffset = (doc as any).lastAutoTable.finalY + 20;

    for (const ref of [salesChartRef, statusChartRef]) {
      if (ref.current) {
        const canvas = await html2canvas(ref.current);
        const imgData = canvas.toDataURL('image/png');
        if (yOffset > 500) { doc.addPage(); yOffset = 40; }
        doc.addImage(imgData, 'PNG', 40, yOffset, 500, 280);
        yOffset += 300;
      }
    }

    if (download) doc.save(`${report.title}.pdf`);
    else doc.output('dataurlnewwindow');
  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Rapports et Analyses</h1>

      {/* ── RAPPORT PRODUITS ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Rapport Produits
            <span className="text-sm font-normal text-gray-400">({products.length} total)</span>
          </h2>
          <button
            onClick={generateProductReportPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter PDF
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{nouveauProducts.length}</p>
            <p className="text-xs text-blue-500 mt-1 font-medium">Nouveaux</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{populaireProducts.length}</p>
            <p className="text-xs text-red-400 mt-1 font-medium">Populaires</p>
          </div>
          <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{outOfStockProducts.length}</p>
            <p className="text-xs text-orange-400 mt-1 font-medium">En rupture</p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{inStockProducts.length}</p>
            <p className="text-xs text-green-500 mt-1 font-medium">En stock</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-5">
          <span className="text-sm text-gray-500 font-medium">Filtrer :</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={filterNew} onChange={e => setFilterNew(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm font-medium text-blue-600">Nouveau</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={filterPopular} onChange={e => setFilterPopular(e.target.checked)} className="w-4 h-4 rounded accent-red-500" />
            <span className="text-sm font-medium text-red-500">Populaire</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={filterOutOfStock} onChange={e => setFilterOutOfStock(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm font-medium text-orange-500">Out of stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={filterInStock} onChange={e => setFilterInStock(e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
            <span className="text-sm font-medium text-green-600">In stock</span>
          </label>
          <span className="ml-auto text-xs text-gray-400">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-[#C86D85] text-white">
                <th className="px-3 py-2.5 text-left font-semibold">Nom du produit</th>
                <th className="px-3 py-2.5 text-left font-semibold">Categorie</th>
                <th className="px-3 py-2.5 text-right font-semibold">Prix HT</th>
                <th className="px-3 py-2.5 text-right font-semibold">TVA</th>
                <th className="px-3 py-2.5 text-right font-semibold">Prix TTC</th>
                <th className="px-3 py-2.5 text-center font-semibold">Stock</th>
                <th className="px-3 py-2.5 text-center font-semibold">Statut</th>
                <th className="px-3 py-2.5 text-center font-semibold">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p, i) => {
                const priceTTC = Number(p.discounted_price || p.original_price || 0);
                const tvaRate = Number(p.tva || p.discount_percentage || 0);
                const tvaCoeff = tvaRate / (100 + tvaRate);
                const tvaAmount = tvaRate > 0 ? priceTTC * tvaCoeff : 0;
                const priceHT = priceTTC - tvaAmount;
                const stock = getStock(p);
                const isOOS = p.stock_status === 'en rupture de stock';
                return (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                    <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={p.name}>{p.name}</td>
                    <td className="px-3 py-2 text-gray-600">{p.category || '-'}</td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">{priceHT.toFixed(3)} TND</td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      <span className="font-medium">{tvaRate}%</span>
                      <span className="text-gray-400 text-xs ml-1">({tvaAmount.toFixed(3)} TND)</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">{priceTTC.toFixed(3)} TND</td>
                    <td className="px-3 py-2 text-center">
                      {stock !== null
                        ? <span className={`font-semibold ${stock === 0 ? 'text-red-500' : stock <= 5 ? 'text-orange-500' : 'text-gray-800'}`}>{stock}</span>
                        : <span className="text-gray-400 text-xs">N/A</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isOOS ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isOOS ? 'Rupture' : 'En stock'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {p.new && <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium">Nouveau</span>}
                        {p.popular && <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium">Populaire</span>}
                        {!p.new && !p.popular && <span className="text-gray-300 text-xs">-</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-gray-400">Aucun produit trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RAPPORT COMMANDES ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" /> Rapport Commandes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="sales">Ventes</option>
            <option value="products">Produits</option>
            <option value="customers">Clients</option>
            <option value="orders">Commandes</option>
          </select>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleGenerateReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 py-2 transition-colors">
            <BarChart3 className="w-4 h-4" /> Générer
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={salesChartRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="mb-4 font-semibold text-gray-800">Tendance des ventes</h3>
          <Line data={salesData} options={chartOptions} />
        </div>
        <div ref={statusChartRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="mb-4 font-semibold text-gray-800">Statut des commandes</h3>
          <Doughnut data={orderStatusData} options={chartOptions} />
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="mb-4 font-semibold text-gray-800">Rapports générés</h2>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>Aucun rapport généré</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{r.title}</h4>
                  <p className="text-sm text-gray-500">{r.dateRange.start} - {r.dateRange.end}</p>
                  <p className="text-xs text-gray-400">Généré le {new Date(r.generatedAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium" onClick={() => generatePDF(r, true)}>Télécharger</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
