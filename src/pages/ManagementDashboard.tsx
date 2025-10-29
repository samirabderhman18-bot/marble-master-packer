import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderManagement } from '@/components/OrderManagement';
import { StockManagement } from '@/components/StockManagement';
import { OffCutManagement } from '@/components/OffCutManagement';
import { Order, Stock, OffCut } from '@/types/orders';
import { ShoppingCart, Package, Recycle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ManagementDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [offCuts, setOffCuts] = useState<OffCut[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('marbleOrders');
    const savedStock = localStorage.getItem('marbleStock');
    const savedOffCuts = localStorage.getItem('marbleOffCuts');

    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedStock) setStock(JSON.parse(savedStock));
    if (savedOffCuts) setOffCuts(JSON.parse(savedOffCuts));
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('marbleOrders', JSON.stringify(orders));
  }, [orders]);

  // Save stock to localStorage
  useEffect(() => {
    localStorage.setItem('marbleStock', JSON.stringify(stock));
  }, [stock]);

  // Save offCuts to localStorage
  useEffect(() => {
    localStorage.setItem('marbleOffCuts', JSON.stringify(offCuts));
  }, [offCuts]);

  // Order handlers
  const handleAddOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  // Stock handlers
  const handleAddStock = (item: Stock) => {
    setStock([item, ...stock]);
  };

  const handleUpdateStock = (updatedItem: Stock) => {
    setStock(stock.map(s => s.id === updatedItem.id ? updatedItem : s));
  };

  const handleDeleteStock = (id: string) => {
    setStock(stock.filter(s => s.id !== id));
  };

  // OffCut handlers
  const handleAddOffCut = (offCut: OffCut) => {
    setOffCuts([offCut, ...offCuts]);
  };

  const handleDeleteOffCut = (id: string) => {
    setOffCuts(offCuts.filter(o => o.id !== id));
  };

  const handleUseOffCut = (offCut: OffCut) => {
    // Remove from offcuts or mark as used
    setOffCuts(offCuts.filter(o => o.id !== offCut.id));
  };

  // Calculate statistics
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingPayments = orders
    .filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0);

  const stockValue = stock.reduce((sum, s) => sum + (s.costPerUnit * s.quantity), 0);

  const usableOffCutsValue = offCuts
    .filter(o => o.isUsable)
    .reduce((sum, o) => sum + o.area, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tableau de Bord de Gestion
          </h1>
          <p className="text-muted-foreground">
            Gestion complète des commandes, stock et chutes
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(0)} DZD</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{orders.length} commande(s)</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paiements en attente</p>
                <p className="text-2xl font-bold">{pendingPayments.toFixed(0)} DZD</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">À encaisser</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valeur du stock</p>
                <p className="text-2xl font-bold">{stockValue.toFixed(0)} DZD</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{stock.length} article(s)</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chutes utilisables</p>
                <p className="text-2xl font-bold">{usableOffCutsValue.toFixed(0)} cm²</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{offCuts.filter(o => o.isUsable).length} chute(s)</p>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="offcuts" className="flex items-center gap-2">
              <Recycle className="w-4 h-4" />
              Chutes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderManagement
              orders={orders}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          </TabsContent>

          <TabsContent value="stock">
            <StockManagement
              stock={stock}
              onAddStock={handleAddStock}
              onUpdateStock={handleUpdateStock}
              onDeleteStock={handleDeleteStock}
            />
          </TabsContent>

          <TabsContent value="offcuts">
            <OffCutManagement
              offCuts={offCuts}
              onAddOffCut={handleAddOffCut}
              onDeleteOffCut={handleDeleteOffCut}
              onUseOffCut={handleUseOffCut}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagementDashboard;
