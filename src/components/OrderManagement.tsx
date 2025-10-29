import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types/orders';
import { Plus, Edit, Trash2, Eye, DollarSign, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface OrderManagementProps {
  orders: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}

export const OrderManagement = ({ orders, onAddOrder, onUpdateOrder, onDeleteOrder }: OrderManagementProps) => {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // New order form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // New item state
  const [itemType, setItemType] = useState('');
  const [itemWidth, setItemWidth] = useState(0);
  const [itemHeight, setItemHeight] = useState(0);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'unpaid': return 'bg-red-500';
      case 'partial': return 'bg-orange-500';
      case 'paid': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const addItemToOrder = () => {
    if (!itemType || itemWidth <= 0 || itemHeight <= 0 || itemQuantity <= 0 || itemPrice <= 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      pieceType: itemType,
      width: itemWidth,
      height: itemHeight,
      quantity: itemQuantity,
      pricePerUnit: itemPrice,
    };

    setOrderItems([...orderItems, newItem]);
    setItemType('');
    setItemWidth(0);
    setItemHeight(0);
    setItemQuantity(1);
    setItemPrice(0);
    toast.success('Article ajouté');
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    if (!customerName || !customerPhone || orderItems.length === 0) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: `CMD-${Date.now()}`,
      customerName,
      customerPhone,
      customerEmail,
      items: orderItems,
      totalAmount: calculateTotal(),
      paidAmount: 0,
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      notes,
    };

    onAddOrder(newOrder);
    resetForm();
    setIsNewOrderOpen(false);
    toast.success('Commande créée avec succès!');
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setOrderItems([]);
    setDeliveryDate('');
    setNotes('');
  };

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    onUpdateOrder({ ...order, status: newStatus, updatedAt: new Date() });
    toast.success('Statut mis à jour');
  };

  const handlePayment = (order: Order, amount: number) => {
    const newPaidAmount = order.paidAmount + amount;
    const paymentStatus: PaymentStatus = 
      newPaidAmount >= order.totalAmount ? 'paid' : 
      newPaidAmount > 0 ? 'partial' : 'unpaid';

    onUpdateOrder({
      ...order,
      paidAmount: newPaidAmount,
      paymentStatus,
      updatedAt: new Date(),
    });
    toast.success('Paiement enregistré');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Gestion des Commandes</h3>
            <p className="text-sm text-muted-foreground">{orders.length} commande(s) au total</p>
          </div>
          <Button onClick={() => setIsNewOrderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Commande
          </Button>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune commande</p>
              </div>
            ) : (
              orders.map(order => (
                <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{order.orderNumber}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Client: {order.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Tel: {order.customerPhone}
                      </p>
                      <p className="text-sm font-semibold">
                        Total: {order.totalAmount.toFixed(2)} DZD
                      </p>
                      <p className="text-sm text-green-600">
                        Payé: {order.paidAmount.toFixed(2)} DZD
                      </p>
                      {order.deliveryDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Livraison: {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsViewOrderOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const amount = parseFloat(prompt('Montant du paiement:') || '0');
                          if (amount > 0) handlePayment(order, amount);
                        }}
                      >
                        <DollarSign className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Supprimer cette commande?')) {
                            onDeleteOrder(order.id);
                            toast.success('Commande supprimée');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* New Order Dialog */}
      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Commande</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom du Client *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label>Téléphone *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0555 00 00 00"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Date de Livraison</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes additionnelles..."
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Articles de la Commande</h4>
              
              <div className="grid grid-cols-5 gap-2 mb-3">
                <Input
                  placeholder="Type"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Largeur (cm)"
                  value={itemWidth || ''}
                  onChange={(e) => setItemWidth(parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="Hauteur (cm)"
                  value={itemHeight || ''}
                  onChange={(e) => setItemHeight(parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="Qté"
                  value={itemQuantity || ''}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                />
                <Input
                  type="number"
                  placeholder="Prix/U"
                  value={itemPrice || ''}
                  onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <Button onClick={addItemToOrder} className="w-full mb-4">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Article
              </Button>

              {orderItems.length > 0 && (
                <div className="space-y-2">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.pieceType}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.width} x {item.height} cm - Qté: {item.quantity} - {item.pricePerUnit} DZD/U
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {(item.pricePerUnit * item.quantity).toFixed(2)} DZD
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg font-bold">
                    <span>Total:</span>
                    <span className="text-lg">{calculateTotal().toFixed(2)} DZD</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateOrder}>
                Créer la Commande
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Commande</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Numéro de Commande</Label>
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div className="flex gap-2 mt-1">
                    <select
                      className="w-full px-3 py-2 rounded-md border border-input bg-background"
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder, e.target.value as OrderStatus)}
                    >
                      <option value="pending">En attente</option>
                      <option value="in-progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <p>{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <Label>Date de Création</Label>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div>
                <Label>Articles</Label>
                <div className="space-y-2 mt-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="p-3 bg-accent rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.pieceType}</span>
                        <span>{(item.pricePerUnit * item.quantity).toFixed(2)} DZD</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.width} x {item.height} cm × {item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-2">
                  <span>Total:</span>
                  <span>{selectedOrder.totalAmount.toFixed(2)} DZD</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Payé:</span>
                  <span>{selectedOrder.paidAmount.toFixed(2)} DZD</span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Reste:</span>
                  <span>{(selectedOrder.totalAmount - selectedOrder.paidAmount).toFixed(2)} DZD</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
