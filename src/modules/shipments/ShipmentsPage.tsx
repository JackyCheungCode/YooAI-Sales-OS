import { useCallback, useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { Add, Renew, Search, WarningAlt, Document } from '@carbon/icons-react';
import { Tile, Tag, FileUploaderButton, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, InlineNotification, Grid, Column, ProgressIndicator, ProgressStep, Modal, ModalHeader, ModalLabel, ModalHeading, ModalBody } from '../../components/carbon/compat';
import { Button } from '../../components/ui/Button';
import { SelectInput, SelectItem, TextInput, TextAreaInput } from '../../components/ui/Field';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import './shipments.css';

type ShipmentStatus = 'draft' | 'pending_booking' | 'booked' | 'containerized' | 'customs_cleared' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'closed' | 'cancelled';
type Shipment = {
  id: string; shipment_number: string; order_id: string; customer_id: string | null; owner_id: string;
  status: ShipmentStatus; release_status: 'pending'|'ready_to_send'|'sent'|'blocked'; shipping_mode: string; incoterm: string | null; origin_port: string | null;
  destination_port: string | null; latest_ship_date: string | null; etd: string | null; eta: string | null;
  actual_arrival_date: string | null; consignee: string | null; notify_party: string | null;
  responsible_name: string | null; booking_number: string | null; bill_of_lading_number: string | null;
  vessel_voyage: string | null; updated_at: string; container_numbers: string | null; seal_numbers: string | null; bill_of_lading_type: string | null; carrier_name: string | null; shipping_line: string | null; container_type: string | null; container_count: number; transshipment_info: string | null; tracking_number: string | null; tracking_url: string | null; notes: string | null; actual_departure_date: string | null; customer_pickup_date: string | null; created_at: string; customers?: { name: string } | null;
  orders?: { order_number: string; status: string } | null;
};
type OrderOption = { id: string; order_number: string; customer_id: string | null; status: string; customers?: { name: string } | null };
type OrderItem = { id: string; product_name: string; sku: string | null; specification: string | null; quantity: number; unit: string; shipped_quantity: number };
type ShipmentItemDraft = { order_item_id: string; product_name: string; sku: string | null; ordered_quantity: number; shipped_quantity: number; unit: string; quantity: string; gross_weight: string; net_weight: string; volume_cbm: string; package_count: string; packaging_method: string; marks: string; note: string };
type ShipmentDocument = { id: string; document_type: string; file_name: string; storage_path: string | null; status: string; created_at: string };
type ShipmentEvent = { id: string; event_type: string; description: string; created_at: string };
type ShipmentCost = { id: string; cost_type: string; currency_code: string; amount: number; supplier: string | null; is_paid: boolean };
type ShipmentException = { id: string; exception_type: string; occurred_at: string; reason: string; resolution: string | null; status: string };
const statuses: { value: ShipmentStatus; label: string }[] = [
  { value: 'draft', label: '草稿' }, { value: 'pending_booking', label: '待订舱' }, { value: 'booked', label: '已订舱' },
  { value: 'containerized', label: '已装柜' }, { value: 'customs_cleared', label: '已报关' }, { value: 'departed', label: '已开船 / 起飞' },
  { value: 'in_transit', label: '运输中' }, { value: 'arrived', label: '已到港' }, { value: 'delivered', label: '已签收' },
  { value: 'closed', label: '已关闭' }, { value: 'cancelled', label: '已取消' },
];
const statusLabel = Object.fromEntries(statuses.map(s => [s.value, s.label])) as Record<ShipmentStatus, string>;
const modes = [{value:'fcl',label:'整柜'},{value:'lcl',label:'拼柜'},{value:'bulk',label:'散货'},{value:'air',label:'空运'},{value:'express',label:'快递'},{value:'rail',label:'铁路'}];
const modeLabel: Record<string,string> = Object.fromEntries(modes.map(m=>[m.value,m.label]));
const documentTypes = ['商业发票','装箱单','提单 / 海运单','原产地证','检验检疫证书','熏蒸 / 消毒证书','保险单','报关资料','订舱确认','装柜照片','客户指定文件'];
const currency = (value:number, code='USD') => { try { return new Intl.NumberFormat('zh-CN',{style:'currency',currency:code,maximumFractionDigits:2}).format(value); } catch { return code+' '+value.toFixed(2); } };

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isFinance, setIsFinance] = useState(false);
  const [canEditShipment, setCanEditShipment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview'|'items'|'logistics'|'documents'|'costs'|'exceptions'|'timeline'>('overview');
  const [orderId, setOrderId] = useState('');
  const [orderItems, setOrderItems] = useState<ShipmentItemDraft[]>([]);
  const [shippingMode, setShippingMode] = useState('fcl');
  const [incoterm, setIncoterm] = useState('FOB');
  const [originPort, setOriginPort] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [latestShipDate, setLatestShipDate] = useState('');
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [consignee, setConsignee] = useState('');
  const [notifyParty, setNotifyParty] = useState('');
  const [bookingNumber, setBookingNumber] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [vesselVoyage, setVesselVoyage] = useState('');
  const [containerNumbers, setContainerNumbers] = useState('');
  const [sealNumbers, setSealNumbers] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [costs, setCosts] = useState<ShipmentCost[]>([]);
  const [exceptions, setExceptions] = useState<ShipmentException[]>([]);
  const [docType, setDocType] = useState(documentTypes[0]);
  const [docStatus, setDocStatus] = useState('pending');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [costType, setCostType] = useState('ocean_freight');
  const [costAmount, setCostAmount] = useState('');
  const [costCurrency, setCostCurrency] = useState('USD');
  const [costSupplier, setCostSupplier] = useState('');
  const [costPaid, setCostPaid] = useState('no');
  const [exceptionType, setExceptionType] = useState('delay');
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionResolution, setExceptionResolution] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [releaseOverrideReason, setReleaseOverrideReason] = useState('');
  const [logisticsDraft, setLogisticsDraft] = useState({shippingMode:'fcl',incoterm:'FOB',originPort:'',destinationPort:'',latestShipDate:'',etd:'',eta:'',responsibleName:'',consignee:'',notifyParty:'',bookingNumber:'',billNumber:'',billType:'',vesselVoyage:'',carrierName:'',shippingLine:'',containerType:'',containerCount:'0',transshipmentInfo:'',containerNumbers:'',sealNumbers:'',trackingNumber:'',trackingUrl:'',notes:''});
  const createFormRef = useRef<HTMLFormElement>(null);
  const createModalRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const modal = createModalRef.current;
    if (!modal) return;
    const close = () => setCreateOpen(false);
    modal.addEventListener('cds-modal-closed', close);
    return () => modal.removeEventListener('cds-modal-closed', close);
  }, [createOpen]);

  const selected = shipments.find(s => s.id === selectedId) ?? null;
  const filtered = useMemo(() => shipments.filter(s => {
    const text = [s.shipment_number, s.orders?.order_number, s.customers?.name, s.destination_port, s.booking_number].filter(Boolean).join(' ').toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (filter === 'all' || s.status === filter);
  }), [shipments, query, filter]);
  const activeCount = shipments.filter(s => !['closed','cancelled','delivered'].includes(s.status)).length;
  const inTransitCount = shipments.filter(s => ['departed','in_transit'].includes(s.status)).length;
  const riskCount = shipments.filter(s => (s.latest_ship_date && s.latest_ship_date < new Date().toISOString().slice(0,10) && ['draft','pending_booking'].includes(s.status)) || s.status === 'cancelled').length;

  const loadShipments = useCallback(async (preserveId?: string) => {
    if (!supabase) { setLoading(false); setError('尚未配置 Supabase。请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY；当前不会显示演示数据。'); return; }
    setLoading(true); setError('');
    const [shipmentResult, orderResult] = await Promise.all([
      supabase.from('shipments').select('*, customers(name), orders(order_number,status)').order('created_at',{ascending:false}).limit(200),
      supabase.from('orders').select('id,order_number,customer_id,status,customers(name)').order('created_at',{ascending:false}).limit(500),
    ]);
    if (shipmentResult.error) setError('读取出运单失败：'+shipmentResult.error.message);
    else {
      const rows = (shipmentResult.data ?? []) as unknown as Shipment[];
      setShipments(rows);
      const wanted = preserveId ?? selectedId;
      if (wanted && rows.some(s=>s.id===wanted)) setSelectedId(wanted);
      else if (!selectedId && rows[0]) setSelectedId(rows[0].id);
    }
    if (orderResult.error) setError(prev => [prev, '读取订单失败：'+orderResult.error.message].filter(Boolean).join('；'));
    else setOrders((orderResult.data ?? []) as unknown as OrderOption[]);
    setLoading(false);
  }, [selectedId]);

  const loadDetails = useCallback(async (shipmentId:string) => {
    if (!supabase || !shipmentId) return;
    const [docRes,eventRes,exceptionRes] = await Promise.all([
      supabase.from('shipment_documents').select('id,document_type,file_name,storage_path,status,created_at').eq('shipment_id',shipmentId).order('created_at',{ascending:false}),
      supabase.from('shipment_events').select('id,event_type,description,created_at').eq('shipment_id',shipmentId).order('created_at',{ascending:false}).limit(100),
      supabase.from('shipment_exceptions').select('id,exception_type,occurred_at,reason,resolution,status').eq('shipment_id',shipmentId).order('occurred_at',{ascending:false}),
    ]);
    let costData:ShipmentCost[]=[];
    let costError:{message:string}|null=null;
    if(isFinance){
      const costRes=await supabase.from('shipment_costs').select('id,cost_type,currency_code,amount,supplier,is_paid').eq('shipment_id',shipmentId).order('created_at',{ascending:false});
      costData=(costRes.data??[]) as ShipmentCost[];
      costError=costRes.error;
    }
    setDocuments((docRes.data ?? []) as ShipmentDocument[]);
    setEvents((eventRes.data ?? []) as ShipmentEvent[]);
    setCosts(costData);
    setExceptions((exceptionRes.data ?? []) as ShipmentException[]);
    const detailError = [docRes.error,eventRes.error,costError,exceptionRes.error].find(Boolean);
    if (detailError) setError('读取出运详情失败：'+detailError.message);
  }, [isFinance]);

  useEffect(() => { void loadShipments(); if(supabase) void supabase.auth.getUser().then(({data})=>{const role=String(data.user?.app_metadata?.role||'');setIsFinance(['finance','admin','executive'].includes(role));setCanEditShipment(['followup','documentation','admin','executive','manager','operations','shipping'].includes(role));}); }, []);
  useEffect(() => { if (selectedId) void loadDetails(selectedId); else { setDocuments([]); setEvents([]); setCosts([]); setExceptions([]); } }, [selectedId,loadDetails]);
  useEffect(() => {
    if (!selected) return;
    setLogisticsDraft({
      shippingMode:selected.shipping_mode||'fcl',incoterm:selected.incoterm||'FOB',originPort:selected.origin_port||'',destinationPort:selected.destination_port||'',
      latestShipDate:selected.latest_ship_date||'',etd:selected.etd||'',eta:selected.eta||'',responsibleName:selected.responsible_name||'',
      consignee:selected.consignee||'',notifyParty:selected.notify_party||'',bookingNumber:selected.booking_number||'',
      billNumber:selected.bill_of_lading_number||'',billType:selected.bill_of_lading_type||'',vesselVoyage:selected.vessel_voyage||'',
      carrierName:selected.carrier_name||'',shippingLine:selected.shipping_line||'',containerType:selected.container_type||'',containerCount:String(selected.container_count||0),transshipmentInfo:selected.transshipment_info||'',
      containerNumbers:selected.container_numbers||'',sealNumbers:selected.seal_numbers||'',trackingNumber:selected.tracking_number||'',
      trackingUrl:selected.tracking_url||'',notes:selected.notes||''
    });
  }, [selectedId,selected?.updated_at]);

  const resetCreate = () => {
    setOrderId(''); setOrderItems([]); setShippingMode('fcl'); setIncoterm('FOB'); setOriginPort(''); setDestinationPort('');
    setLatestShipDate(''); setEtd(''); setEta(''); setResponsibleName(''); setConsignee(''); setNotifyParty('');
    setBookingNumber(''); setBillNumber(''); setVesselVoyage(''); setContainerNumbers(''); setSealNumbers(''); setNotes('');
  };
  const changeOrder = async (nextOrderId:string) => {
    setOrderId(nextOrderId); setOrderItems([]);
    if (!supabase || !nextOrderId) return;
    const {data,error:loadError} = await supabase.from('order_items').select('id,product_name,sku,specification,quantity,unit,shipped_quantity').eq('order_id',nextOrderId).order('created_at',{ascending:true});
    if (loadError) { setError('读取订单明细失败：'+loadError.message); return; }
    setOrderItems(((data ?? []) as OrderItem[]).map(item=>({
      order_item_id:item.id, product_name:item.product_name, sku:item.sku, ordered_quantity:Number(item.quantity),
      shipped_quantity:Number(item.shipped_quantity), unit:item.unit, quantity:String(Math.max(0,Number(item.quantity)-Number(item.shipped_quantity))),
      gross_weight:'',net_weight:'',volume_cbm:'',package_count:'',packaging_method:'',marks:'',note:'',
    })));
    const order=orders.find(o=>o.id===nextOrderId);
    setConsignee(order?.customers?.name ?? '');
    setNotifyParty(order?.customers?.name ?? '');
  };
  const updateItem = (id:string,key:keyof ShipmentItemDraft,value:string) => setOrderItems(items=>items.map(item=>item.order_item_id===id?{...item,[key]:value}:item));
  const saveShipment = async (event:FormEvent) => {
    event.preventDefault(); if (!supabase || saving) return;
    setError(''); setNotice('');
    if (!orderId) { setError('请先选择所属订单。'); return; }
    const selectedItems=orderItems.filter(item=>Number(item.quantity)>0);
    if (!selectedItems.length) { setError('请至少填写一条大于 0 的出运明细。'); return; }
    for (const item of selectedItems) {
      const amount=Number(item.quantity);
      if (!Number.isFinite(amount)||amount<=0||amount>item.ordered_quantity-item.shipped_quantity) { setError('产品「'+item.product_name+'」的出运数量无效或超过剩余数量。'); return; }
    }
    setSaving(true);
    const payload=selectedItems.map(item=>({
      order_item_id:item.order_item_id, quantity:Number(item.quantity), gross_weight:Number(item.gross_weight||0),
      net_weight:Number(item.net_weight||0), volume_cbm:Number(item.volume_cbm||0), package_count:Number(item.package_count||0),
      packaging_method:item.packaging_method||null, marks:item.marks||null, note:item.note||null,
    }));
    const {data,error:saveError}=await supabase.rpc('create_shipment_with_items',{
      p_order_id:orderId,p_shipping_mode:shippingMode,p_incoterm:incoterm,p_origin_port:originPort||null,
      p_destination_port:destinationPort||null,p_latest_ship_date:latestShipDate||null,p_etd:etd||null,p_eta:eta||null,
      p_responsible_name:responsibleName||null,p_consignee:consignee||null,p_notify_party:notifyParty||null,
      p_booking_number:bookingNumber||null,p_bill_of_lading_number:billNumber||null,p_vessel_voyage:vesselVoyage||null,
      p_container_numbers:containerNumbers||null,p_seal_numbers:sealNumbers||null,p_notes:notes||null,p_items:payload,
    });
    setSaving(false);
    if (saveError) { setError('创建出运单失败：'+saveError.message); return; }
    const newId=typeof data==='string'?data:(data as {id?:string;shipment_id?:string}|null)?.shipment_id??(data as {id?:string}|null)?.id;
    setCreateOpen(false); resetCreate(); setNotice('出运单已保存至数据库。');
    await loadShipments(newId);
    if (newId) setSelectedId(newId);
  };
  const updateStatus = async (next:ShipmentStatus,reason?:string) => {
    if (!supabase||!selected||saving) return;
    setSaving(true);setError('');setNotice('');
    const {error:statusError}=await supabase.rpc('transition_shipment_status',{p_shipment_id:selected.id,p_new_status:next,p_reason:next==='cancelled'?reason??null:null});
    setSaving(false);
    if(statusError){setError('状态更新失败：'+statusError.message);return;}
    setNotice('出运状态已更新。');await loadShipments(selected.id);
  };
  const confirmRelease = async () => {
    if(!supabase||!selected||saving||!isFinance)return;
    if(!currentDocumentsReady){setError('所有出运单证都必须处于“已审核”状态后才能申请放单。');return;}
    setSaving(true);setError('');setNotice('');
    const reason=releaseOverrideReason.trim();
    const {data,error:releaseError}=await supabase.rpc('confirm_shipment_release',{
      p_shipment_id:selected.id,p_finance_override:Boolean(reason),p_override_reason:reason||null
    });
    setSaving(false);
    if(releaseError){setError('放单确认未通过：'+releaseError.message);return;}
    const result=data as {balance_due_unconfirmed?:boolean}|null;
    setNotice(result?.balance_due_unconfirmed?'财务已记录尾款未确认到账的放单例外。':'财务已确认单证齐套，可按流程寄单。');
    setReleaseOverrideReason('');
    await loadShipments(selected.id);
  };
  const saveLogistics = async () => {
    if(!supabase||!selected||saving)return;
    setSaving(true);setError('');setNotice('');
    const d=logisticsDraft;
    const {error:saveError}=await supabase.rpc('update_shipment_logistics',{
      p_shipment_id:selected.id,p_shipping_mode:d.shippingMode,p_incoterm:d.incoterm||null,p_origin_port:d.originPort||null,
      p_destination_port:d.destinationPort||null,p_latest_ship_date:d.latestShipDate||null,p_etd:d.etd||null,p_eta:d.eta||null,
      p_responsible_name:d.responsibleName||null,p_consignee:d.consignee||null,p_notify_party:d.notifyParty||null,
      p_booking_number:d.bookingNumber||null,p_bill_of_lading_number:d.billNumber||null,p_bill_of_lading_type:d.billType||null,
      p_vessel_voyage:d.vesselVoyage||null,p_carrier_name:d.carrierName||null,p_shipping_line:d.shippingLine||null,p_container_type:d.containerType||null,
      p_container_count:Number(d.containerCount||0),p_transshipment_info:d.transshipmentInfo||null,p_container_numbers:d.containerNumbers||null,p_seal_numbers:d.sealNumbers||null,
      p_tracking_number:d.trackingNumber||null,p_tracking_url:d.trackingUrl||null,p_notes:d.notes||null
    });
    setSaving(false);if(saveError){setError('保存物流信息失败：'+saveError.message);return;}
    setNotice('物流信息已保存至数据库。');await loadShipments(selected.id);
  };
  const addDocument = async () => {
    if(!supabase||!selected||!docFile||saving)return;
    setSaving(true);setError('');
    const safeName=docFile.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    const path=selected.owner_id+'/'+selected.id+'/'+crypto.randomUUID()+'-'+safeName;
    const {error:uploadError}=await supabase.storage.from('shipment-documents').upload(path,docFile,{upsert:false,contentType:docFile.type||'application/octet-stream'});
    if(uploadError){setSaving(false);setError('文件上传失败：'+uploadError.message);return;}
    const {error:recordError}=await supabase.from('shipment_documents').insert({shipment_id:selected.id,owner_id:selected.owner_id,document_type:docType,file_name:docFile.name,storage_path:path,mime_type:docFile.type||null,file_size:docFile.size,status:docStatus});
    setSaving(false);if(recordError){setError('文件记录保存失败：'+recordError.message);return;}
    setDocFile(null);setNotice('单证已上传。');await loadDetails(selected.id);
  };
  const updateDocumentStatus=async(id:string,status:string)=>{
    if(!supabase||saving)return;
    if(status==='sent'&&selected?.release_status!=='ready_to_send'){setError('必须先由财务确认可寄单，才能将单证标记为已寄出。');return;}
    setSaving(true);setError('');
    const {error:changeError}=await supabase.from('shipment_documents').update({status}).eq('id',id);
    setSaving(false);if(changeError){setError('更新单证状态失败：'+changeError.message);return;}
    setNotice('单证状态已更新。');if(selected)await loadDetails(selected.id);
  };
  const addCost=async()=>{
    if(!supabase||!selected||saving)return;const amount=Number(costAmount);
    if(!Number.isFinite(amount)||amount<0){setError('费用金额必须为非负数字。');return;}
    setSaving(true);setError('');
    const {error:insertError}=await supabase.from('shipment_costs').insert({shipment_id:selected.id,owner_id:selected.owner_id,cost_type:costType,amount,currency_code:costCurrency,supplier:costSupplier||null,is_paid:costPaid==='yes',paid_at:costPaid==='yes'?new Date().toISOString().slice(0,10):null});
    setSaving(false);if(insertError){setError('保存费用失败：'+insertError.message);return;}
    setCostAmount('');setCostSupplier('');setCostPaid('no');setNotice('费用已记录。');await loadDetails(selected.id);
  };
  const updateExceptionStatus=async(id:string,status:'open'|'investigating'|'resolved')=>{
    if(!supabase||saving||!selected)return;setSaving(true);setError('');
    const {error:updateError}=await supabase.from('shipment_exceptions').update({status}).eq('id',id);
    setSaving(false);if(updateError){setError('更新异常状态失败：'+updateError.message);return;}
    setNotice('异常处理状态已更新。');await loadDetails(selected.id);
  };
  const addException=async()=>{
    if(!supabase||!selected||saving||!exceptionReason.trim())return;setSaving(true);setError('');
    const {error:insertError}=await supabase.from('shipment_exceptions').insert({shipment_id:selected.id,owner_id:selected.owner_id,exception_type:exceptionType,reason:exceptionReason.trim(),resolution:exceptionResolution||null});
    setSaving(false);if(insertError){setError('保存异常失败：'+insertError.message);return;}
    setExceptionReason('');setExceptionResolution('');setNotice('异常已记录。');await loadDetails(selected.id);
  };
  const addTimelineEvent=async()=>{
    if(!supabase||!selected||saving||!timelineDescription.trim())return;setSaving(true);setError('');
    const {error:insertError}=await supabase.from('shipment_events').insert({shipment_id:selected.id,owner_id:selected.owner_id,event_type:'note',description:timelineDescription.trim()});
    setSaving(false);if(insertError){setError('保存时间线失败：'+insertError.message);return;}
    setTimelineDescription('');setNotice('时间线记录已添加。');await loadDetails(selected.id);
  };
  const progressStatuses=statuses.filter(s=>!['closed','cancelled'].includes(s.value));
  const progressIndex=selected?.status==='closed'?progressStatuses.length:selected?progressStatuses.findIndex(s=>s.value===selected.status):-1;
  const currentDocumentsReady=documents.length>0&&documents.every(d=>d.status==='approved');
  const canRelease=selected&&currentDocumentsReady;
  const totalCostByCurrency=costs.reduce<Record<string,number>>((totals,c)=>({...totals,[c.currency_code]:(totals[c.currency_code]||0)+Number(c.amount)}),{});

  return <div className="shipments-page">
    <header className="shipments-heading">
      <div><div className="shipments-eyebrow">FULFILLMENT / LOGISTICS</div><h1>出运单 <span>Shipment</span></h1><p>订单履约、物流进度、单证与费用的统一工作台。</p></div>
      <div className="shipments-heading-actions"><Button variant="secondary" onClick={()=>void loadShipments()} disabled={loading}><Renew size={16}/>刷新</Button><Button onClick={()=>{resetCreate();setCreateOpen(true);setError('');}} disabled={!canEditShipment||loading}><Add size={16}/>新建出运单</Button></div>
    </header>

    {!isSupabaseConfigured&&<InlineNotification kind="error" title="数据库尚未配置" subtitle="已禁用演示数据。配置 Supabase 环境变量后才能读取或创建真实出运单。" hideCloseButton />}
    {error&&<InlineNotification kind="error" title="操作未完成" subtitle={error} hideCloseButton />}
    {notice&&<InlineNotification kind="success" title="已完成" subtitle={notice} hideCloseButton />}

    <Grid fullWidth className="shipments-kpis" aria-label="出运摘要">
      <Column sm={2} md={2} lg={4} xlg={4}><Tile><span>出运批次</span><strong>{shipments.length}</strong><small>数据库记录</small></Tile></Column>
      <Column sm={2} md={2} lg={4} xlg={4}><Tile><span>进行中</span><strong>{activeCount}</strong><small>未关闭出运单</small></Tile></Column>
      <Column sm={2} md={2} lg={4} xlg={4}><Tile><span>运输途中</span><strong>{inTransitCount}</strong><small>已开船 / 运输中</small></Tile></Column>
      <Column sm={2} md={2} lg={4} xlg={4}><Tile><span>风险关注</span><strong>{riskCount}</strong><small>需检查的记录</small></Tile></Column>
    </Grid>

    <Grid fullWidth className="shipments-workspace">
      <Column sm={4} md={3} lg={5} xlg={5}><section className="shipments-list-panel">
        <div className="shipments-panel-heading"><h2>出运记录</h2><span>{filtered.length} 条</span></div>
        <div className="shipments-list-tools">
          <div className="shipments-search"><Search size={16}/><TextInput aria-label="搜索出运单" placeholder="编号、订单、客户、目的港" value={query} onChange={e=>setQuery(e.target.value)}/></div>
          <SelectInput aria-label="按状态筛选" value={filter} onChange={e=>setFilter(e.target.value)}><SelectItem value="all" text="全部状态"/>{statuses.map(s=><SelectItem key={s.value} value={s.value} text={s.label}/>)}</SelectInput>
        </div>
        {loading?<p className="shipments-empty">正在读取云端出运记录…</p>:filtered.length===0?<p className="shipments-empty">{error?'请检查数据库连接与迁移状态。':'暂无匹配的出运记录。请从真实订单创建第一张出运单。'}</p>:<div className="shipments-records">{filtered.map(s=><Button type="button" variant={selectedId===s.id?'secondary':'ghost'} className="shipment-record" key={s.id} onClick={()=>{setSelectedId(s.id);setActiveTab('overview');}}><div className="shipment-record-top"><strong>{s.shipment_number}</strong><Tag type={s.status==='cancelled'?'red':s.status==='delivered'||s.status==='closed'?'green':s.status==='in_transit'||s.status==='departed'?'blue':'gray'}>{statusLabel[s.status]||s.status}</Tag></div><span>{s.orders?.order_number||'—'} · {s.customers?.name||'未关联客户'}</span><small>{s.origin_port||'起运港待定'} → {s.destination_port||'目的港待定'}</small><small>ETA：{s.eta||'未安排'}</small></Button>)}</div>}
      </section></Column><Column sm={4} md={5} lg={11} xlg={11}><section className="shipments-detail-panel">
        {!selected?<div className="shipments-empty shipments-empty--detail"><Document size={28}/><strong>选择一张出运单</strong><span>查看摘要、物流进度、明细、单证和费用。</span></div>:<>
          <div className="shipment-detail-header"><div><div className="shipments-eyebrow">{selected.shipment_number}</div><h2>{selected.customers?.name||'客户待确认'}</h2><p>订单 {selected.orders?.order_number||'—'} · {modeLabel[selected.shipping_mode]||selected.shipping_mode}</p></div><Tag type={selected.status==='cancelled'?'red':selected.status==='delivered'||selected.status==='closed'?'green':'blue'}>{statusLabel[selected.status]||selected.status}</Tag></div>
          <div className="shipment-route"><div><small>起运港</small><strong>{selected.origin_port||'待安排'}</strong></div><span aria-hidden="true">→</span><div><small>目的港</small><strong>{selected.destination_port||'待安排'}</strong></div></div>
          <ProgressIndicator className="shipment-milestones" aria-label="物流进度">{progressStatuses.map((s,i)=><ProgressStep key={s.value} label={s.label} description={s.label} state={i<progressIndex?'complete':i===progressIndex?'current':'incomplete'} />)}</ProgressIndicator>
          <div className="shipment-action-row"><SelectInput aria-label="更新出运状态" value={selected.status} onChange={e=>{const next=e.target.value as ShipmentStatus;if(next!==selected.status)void updateStatus(next);}} disabled={saving||!canEditShipment||['closed','cancelled'].includes(selected.status)}>{statuses.filter(s=>s.value===selected.status||s.value===statuses[statuses.findIndex(x=>x.value===selected.status)+1]?.value).map(s=><SelectItem key={s.value} value={s.value} text={s.label}/>)}</SelectInput><Button variant="secondary" disabled={!canRelease||!isFinance||saving||selected.release_status==='ready_to_send'||selected.release_status==='sent'} onClick={()=>void confirmRelease()}><Document size={16}/>{selected.release_status==='ready_to_send'?'已确认可寄单':selected.release_status==='sent'?'已完成寄单':'财务确认可寄单'}</Button></div>
          <nav className="shipment-tabs" aria-label="出运详情分区">{([{id:'overview',label:'头信息'},{id:'items',label:'出运明细'},{id:'logistics',label:'物流信息'},{id:'documents',label:'单证清单'},{id:'costs',label:'费用'},{id:'exceptions',label:'异常记录'},{id:'timeline',label:'时间线'}] as const).filter(t=>t.id!=='costs'||isFinance).map(t=><Button key={t.id} type="button" variant={activeTab===t.id?'primary':'ghost'} className="shipment-tab" role="tab" aria-selected={activeTab===t.id} onClick={()=>setActiveTab(t.id)}>{t.label}</Button>)}</nav>
          {activeTab==='overview'&&<div className="shipment-section"><h3>出运摘要</h3><dl className="shipment-facts"><div><dt>所属订单</dt><dd>{selected.orders?.order_number||'—'}</dd></div><div><dt>贸易术语</dt><dd>{selected.incoterm||'—'}</dd></div><div><dt>负责人</dt><dd>{selected.responsible_name||'未指定'}</dd></div><div><dt>最晚装运日</dt><dd>{selected.latest_ship_date||'—'}</dd></div><div><dt>预计开船</dt><dd>{selected.etd||'—'}</dd></div><div><dt>预计到港</dt><dd>{selected.eta||'—'}</dd></div><div><dt>收货人</dt><dd>{selected.consignee||'—'}</dd></div><div><dt>通知方</dt><dd>{selected.notify_party||'—'}</dd></div><div><dt>订舱号</dt><dd>{selected.booking_number||'—'}</dd></div><div><dt>提单号</dt><dd>{selected.bill_of_lading_number||'—'}</dd></div><div><dt>船名航次</dt><dd>{selected.vessel_voyage||'—'}</dd></div></dl><h3>风险提示</h3><ul className="shipment-risk-list">{selected.latest_ship_date&&selected.latest_ship_date<new Date().toISOString().slice(0,10)&&['draft','pending_booking'].includes(selected.status)&&<li><WarningAlt size={16}/>已超过最晚装运日，尚未订舱。</li>}{selected.eta&&selected.eta<new Date().toISOString().slice(0,10)&&!['arrived','delivered','closed'].includes(selected.status)&&<li><WarningAlt size={16}/>预计到港日期已过，请核实物流状态。</li>}{documents.some(d=>d.status!=='approved')&&<li><WarningAlt size={16}/>存在未审核单证，不能视为具备放单条件。</li>}{costs.length===0&&<li><WarningAlt size={16}/>尚未录入本批物流费用。</li>}{exceptions.some(e=>e.status!=='resolved')&&<li><WarningAlt size={16}/>存在未解决异常，请及时跟进。</li>}{!selected.latest_ship_date&&!selected.eta&&<li>尚未填写关键装运日期。</li>}</ul>{canEditShipment&&!['closed','cancelled','departed','in_transit','arrived','delivered'].includes(selected.status)&&<Grid fullWidth className="shipment-inline-form"><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="取消出运单原因" placeholder="取消原因（必填）" value={cancelReason} onChange={e=>setCancelReason(e.target.value)}/> </Column><Column sm={4} md={4} lg={4} xlg={4}> <Button variant="danger" disabled={saving||!cancelReason.trim()} onClick={()=>void updateStatus('cancelled',cancelReason.trim())}>取消出运单</Button> </Column></Grid>}</div>}
          {activeTab==='items'&&<div className="shipment-section"><h3>本批出运明细</h3><div className="shipment-table-wrap"><Table className="shipment-table"><TableHead><TableRow><TableHeader>产品</TableHeader><TableHeader>SKU</TableHeader><TableHeader>本批数量</TableHeader><TableHeader>毛重</TableHeader><TableHeader>净重</TableHeader><TableHeader>体积 m³</TableHeader><TableHeader>件数</TableHeader></TableRow></TableHead><TableBody>{/* details are fetched from the database on demand */}<ShipmentItemsTable shipmentId={selected.id}/></TableBody></Table></div></div>}
          {activeTab==='logistics'&&<div className="shipment-section"><h3>运输与柜货信息</h3><Grid fullWidth className="shipment-form-grid">
<Column sm={4} md={4} lg={4} xlg={4}> <label>装运方式<SelectInput value={logisticsDraft.shippingMode} onChange={e=>setLogisticsDraft(d=>({...d,shippingMode:e.target.value}))}>{modes.map(m=><SelectItem key={m.value} value={m.value} text={m.label}/>)}</SelectInput></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>贸易术语<SelectInput value={logisticsDraft.incoterm} onChange={e=>setLogisticsDraft(d=>({...d,incoterm:e.target.value}))}>{['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(x=><SelectItem key={x} value={x} text={x}/>)}</SelectInput></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>起运港<TextInput value={logisticsDraft.originPort} onChange={e=>setLogisticsDraft(d=>({...d,originPort:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>目的港<TextInput value={logisticsDraft.destinationPort} onChange={e=>setLogisticsDraft(d=>({...d,destinationPort:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>最晚装运日<TextInput type="date" value={logisticsDraft.latestShipDate} onChange={e=>setLogisticsDraft(d=>({...d,latestShipDate:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>预计开船 / 起飞<TextInput type="date" value={logisticsDraft.etd} onChange={e=>setLogisticsDraft(d=>({...d,etd:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>预计到港<TextInput type="date" value={logisticsDraft.eta} onChange={e=>setLogisticsDraft(d=>({...d,eta:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>负责人<TextInput value={logisticsDraft.responsibleName} onChange={e=>setLogisticsDraft(d=>({...d,responsibleName:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>收货人<TextInput value={logisticsDraft.consignee} onChange={e=>setLogisticsDraft(d=>({...d,consignee:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>通知方<TextInput value={logisticsDraft.notifyParty} onChange={e=>setLogisticsDraft(d=>({...d,notifyParty:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>订舱号<TextInput value={logisticsDraft.bookingNumber} onChange={e=>setLogisticsDraft(d=>({...d,bookingNumber:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>提单号<TextInput value={logisticsDraft.billNumber} onChange={e=>setLogisticsDraft(d=>({...d,billNumber:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>提单类型<SelectInput value={logisticsDraft.billType} onChange={e=>setLogisticsDraft(d=>({...d,billType:e.target.value}))}><SelectItem value="" text="未指定"/><SelectItem value="original" text="正本"/><SelectItem value="telex_release" text="电放"/><SelectItem value="sea_waybill" text="海运单"/></SelectInput></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>船名航次 / 航班<TextInput value={logisticsDraft.vesselVoyage} onChange={e=>setLogisticsDraft(d=>({...d,vesselVoyage:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>货代 / 承运人<TextInput value={logisticsDraft.carrierName} onChange={e=>setLogisticsDraft(d=>({...d,carrierName:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>船公司 / 航空公司<TextInput value={logisticsDraft.shippingLine} onChange={e=>setLogisticsDraft(d=>({...d,shippingLine:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>柜型<TextInput value={logisticsDraft.containerType} onChange={e=>setLogisticsDraft(d=>({...d,containerType:e.target.value}))} placeholder="例如 40HQ"/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>柜数<TextInput type="number" min="0" value={logisticsDraft.containerCount} onChange={e=>setLogisticsDraft(d=>({...d,containerCount:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>中转港 / 转运信息<TextInput value={logisticsDraft.transshipmentInfo} onChange={e=>setLogisticsDraft(d=>({...d,transshipmentInfo:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>柜号<TextInput value={logisticsDraft.containerNumbers} onChange={e=>setLogisticsDraft(d=>({...d,containerNumbers:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>封条号<TextInput value={logisticsDraft.sealNumbers} onChange={e=>setLogisticsDraft(d=>({...d,sealNumbers:e.target.value}))}/></label> </Column>
<Column sm={4} md={4} lg={4} xlg={4}> <label>物流跟踪号<TextInput value={logisticsDraft.trackingNumber} onChange={e=>setLogisticsDraft(d=>({...d,trackingNumber:e.target.value}))}/></label> </Column><Column sm={4} md={4} lg={4} xlg={4}> <label>跟踪链接<TextInput value={logisticsDraft.trackingUrl} onChange={e=>setLogisticsDraft(d=>({...d,trackingUrl:e.target.value}))}/></label> </Column>
</Grid><label className="shipment-form-wide">备注<TextAreaInput value={logisticsDraft.notes} onChange={e=>setLogisticsDraft(d=>({...d,notes:e.target.value}))}/></label><Button onClick={()=>void saveLogistics()} disabled={saving||!canEditShipment||['closed','cancelled'].includes(selected.status)}>保存物流信息</Button><dl className="shipment-facts"><div><dt>实际到港</dt><dd>{selected.actual_arrival_date||'—'}</dd></div><div><dt>客户提货日</dt><dd>{selected.customer_pickup_date||'—'}</dd></div></dl></div>}{activeTab==='documents'&&<div className="shipment-section"><h3>单证清单</h3><p>放单状态：{selected.release_status==='ready_to_send'?'可寄单':selected.release_status==='sent'?'已寄单':selected.release_status==='blocked'?'已阻止（尾款未确认）':'待财务确认'}</p>{isFinance&&<Grid fullWidth className="shipment-inline-form"><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="财务放单例外原因" placeholder="如尾款未到账但需例外放单，请填写原因" value={releaseOverrideReason} onChange={e=>setReleaseOverrideReason(e.target.value)}/> </Column><Column sm={4} md={4} lg={4} xlg={4}> <span>只有在确有例外时填写原因；该操作将写入审计时间线。</span> </Column></Grid>}<Grid fullWidth className="shipment-inline-form"><Column sm={4} md={4} lg={4} xlg={4}> <SelectInput aria-label="单证类型" value={docType} onChange={e=>setDocType(e.target.value)}>{documentTypes.map(d=><SelectItem key={d} value={d} text={d}/>)}</SelectInput> </Column><Column sm={4} md={4} lg={4} xlg={4}> <SelectInput aria-label="上传时单证状态" value={docStatus} onChange={e=>setDocStatus(e.target.value)}><SelectItem value="pending" text="待准备"/><SelectItem value="prepared" text="已准备"/></SelectInput> </Column><Column sm={4} md={4} lg={4} xlg={4}> <FileUploaderButton disabled={!canEditShipment||['ready_to_send','sent'].includes(selected.release_status)} labelText="选择单证文件" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(e:any)=>setDocFile(e.target.files?.[0]??null)}>选择文件</FileUploaderButton> </Column><Column sm={4} md={4} lg={4} xlg={4}> {docFile&&<span>{docFile.name}</span>} </Column></Grid><Button onClick={()=>void addDocument()} disabled={!canEditShipment||['ready_to_send','sent'].includes(selected.release_status)||!docFile||saving}><Add size={16}/>上传单证</Button><div className="shipment-table-wrap"><Table className="shipment-table"><TableHead><TableRow><TableHeader>单证</TableHeader><TableHeader>文件</TableHeader><TableHeader>状态</TableHeader><TableHeader>上传时间</TableHeader><TableHeader>操作</TableHeader></TableRow></TableHead><TableBody>{documents.map(d=><TableRow key={d.id}><TableCell>{d.document_type}</TableCell><TableCell>{d.file_name}</TableCell><TableCell>{d.status==='approved'?'已审核':d.status==='prepared'?'已准备':d.status==='sent'?'已寄出':'待准备'}</TableCell><TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell><TableCell><SelectInput aria-label={'更新'+d.file_name+'状态'} value={d.status} disabled={!canEditShipment||saving} onChange={e=>void updateDocumentStatus(d.id,e.target.value)}><SelectItem value="pending" text="待准备"/><SelectItem value="prepared" text="已准备"/><SelectItem value="approved" text="已审核"/><SelectItem value="sent" text="已寄出"/></SelectInput>{d.storage_path&&<Button variant="ghost" size="sm" onClick={async()=>{if(!supabase||!d.storage_path)return;const {data,error:downloadError}=await supabase.storage.from('shipment-documents').createSignedUrl(d.storage_path,300);if(downloadError)setError(downloadError.message);else if(data?.signedUrl)window.open(data.signedUrl,'_blank','noopener,noreferrer');}}>下载</Button>}</TableCell></TableRow>)}</TableBody></Table></div>{documents.length===0&&<p className="shipments-empty">暂无单证记录。</p>}</div>}
          {activeTab==='costs'&&<div className="shipment-section"><h3>本批物流费用</h3><p className="shipment-cost-total">已录入费用合计 {Object.keys(totalCostByCurrency).length?Object.entries(totalCostByCurrency).map(([code,amount])=><strong key={code}>{currency(amount,code)}</strong>):<strong>暂无费用记录</strong>}<small>按原币种分别汇总；不同币种未换算，不会混算为单一总成本。</small></p><Grid fullWidth className="shipment-inline-form"><Column sm={4} md={4} lg={4} xlg={4}> <SelectInput aria-label="费用类别" value={costType} onChange={e=>setCostType(e.target.value)}>{[{value:'ocean_freight',label:'海运 / 空运费'},{value:'booking_surcharge',label:'订舱附加费'},{value:'customs',label:'报关费'},{value:'trucking',label:'拖车费'},{value:'storage',label:'仓储费'},{value:'inspection',label:'商检费'},{value:'insurance',label:'保险费'},{value:'other',label:'其他杂费'}].map(x=><SelectItem key={x.value} value={x.value} text={x.label}/>)}</SelectInput> </Column><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="费用金额" type="number" min="0" placeholder="金额" value={costAmount} onChange={e=>setCostAmount(e.target.value)}/> </Column><Column sm={4} md={4} lg={4} xlg={4}> <SelectInput aria-label="费用币种" value={costCurrency} onChange={e=>setCostCurrency(e.target.value)}>{['USD','EUR','CNY','JPY','GBP','HKD'].map(c=><SelectItem key={c} value={c} text={c}/>)}</SelectInput> </Column><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="供应商" placeholder="供应商 / 货代" value={costSupplier} onChange={e=>setCostSupplier(e.target.value)}/> </Column><Column sm={4} md={4} lg={4} xlg={4}> <SelectInput aria-label="付款状态" value={costPaid} onChange={e=>setCostPaid(e.target.value)}><SelectItem value="no" text="未付款"/><SelectItem value="yes" text="已付款"/></SelectInput> </Column></Grid><Button onClick={()=>void addCost()} disabled={!costAmount||saving}><Add size={16}/>记录费用</Button><div className="shipment-table-wrap"><Table className="shipment-table"><TableHead><TableRow><TableHeader>类别</TableHeader><TableHeader>金额</TableHeader><TableHeader>供应商</TableHeader><TableHeader>付款状态</TableHeader></TableRow></TableHead><TableBody>{costs.map(c=><TableRow key={c.id}><TableCell>{c.cost_type}</TableCell><TableCell>{currency(Number(c.amount),c.currency_code)}</TableCell><TableCell>{c.supplier||'—'}</TableCell><TableCell>{c.is_paid?'已付':'未付'}</TableCell></TableRow>)}</TableBody></Table></div></div>}
          {activeTab==='exceptions'&&<div className="shipment-section"><h3>异常与处理</h3><Grid fullWidth className="shipment-inline-form"><Column sm={4} md={4} lg={4} xlg={4}> <SelectInput aria-label="异常类型" value={exceptionType} onChange={e=>setExceptionType(e.target.value)}>{[{value:'delay',label:'延误'},{value:'rolled',label:'甩柜'},{value:'inspection',label:'查验'},{value:'damage',label:'破损'},{value:'shortage',label:'短装'},{value:'wrong_goods',label:'错发'},{value:'document_error',label:'单据错误'},{value:'other',label:'其他'}].map(x=><SelectItem key={x.value} value={x.value} text={x.label}/>)}</SelectInput> </Column><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="异常原因" placeholder="原因（必填）" value={exceptionReason} onChange={e=>setExceptionReason(e.target.value)}/> </Column><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="处理结果" placeholder="处理措施 / 结果" value={exceptionResolution} onChange={e=>setExceptionResolution(e.target.value)}/> </Column></Grid><Button onClick={()=>void addException()} disabled={!canEditShipment||!exceptionReason.trim()||saving}><Add size={16}/>记录异常</Button><div className="shipment-table-wrap"><Table className="shipment-table"><TableHead><TableRow><TableHeader>类型</TableHeader><TableHeader>发生时间</TableHeader><TableHeader>原因</TableHeader><TableHeader>处理结果</TableHeader><TableHeader>状态</TableHeader></TableRow></TableHead><TableBody>{exceptions.map(x=><TableRow key={x.id}><TableCell>{x.exception_type}</TableCell><TableCell>{new Date(x.occurred_at).toLocaleString()}</TableCell><TableCell>{x.reason}</TableCell><TableCell>{x.resolution||'待处理'}</TableCell><TableCell><SelectInput aria-label="更新异常处理状态" value={x.status} disabled={!canEditShipment||saving} onChange={e=>void updateExceptionStatus(x.id,e.target.value as 'open'|'investigating'|'resolved')}><SelectItem value="open" text="待处理"/><SelectItem value="investigating" text="处理中"/><SelectItem value="resolved" text="已解决"/></SelectInput></TableCell></TableRow>)}</TableBody></Table></div></div>}
          {activeTab==='timeline'&&<div className="shipment-section"><h3>操作时间线</h3><Grid fullWidth className="shipment-inline-form"><Column sm={4} md={4} lg={4} xlg={4}> <TextInput aria-label="时间线备注" placeholder="记录跟进情况" value={timelineDescription} onChange={e=>setTimelineDescription(e.target.value)}/> </Column><Column sm={4} md={4} lg={4} xlg={4}> <Button onClick={()=>void addTimelineEvent()} disabled={!canEditShipment||!timelineDescription.trim()||saving}><Add size={16}/>添加记录</Button> </Column></Grid><ol className="shipment-timeline">{events.map(e=><li key={e.id}><span className="shipment-timeline-dot"/><div><strong>{e.event_type==='status_changed'?'状态变更':e.event_type==='created'?'创建出运单':'跟进记录'}</strong><p>{e.description}</p><small>{new Date(e.created_at).toLocaleString()}</small></div></li>)}</ol>{events.length===0&&<p className="shipments-empty">暂无时间线记录。</p>}</div>}
        </>}
      </section></Column>
    </Grid>

    {createOpen&&<Modal ref={createModalRef} open size="lg" aria-label="新建出运单">
      <ModalHeader><div><ModalLabel>NEW SHIPMENT</ModalLabel><ModalHeading id="shipment-create-title">新建出运单</ModalHeading></div><Button variant="ghost" onClick={()=>setCreateOpen(false)}>关闭</Button></ModalHeader>
      <ModalBody><form ref={createFormRef} className="shipment-modal-form" onSubmit={saveShipment}><button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      <Grid fullWidth className="shipment-form-grid">
        <Column sm={4} md={4} lg={4} xlg={4}> <label>所属订单（必填）<SelectInput value={orderId} onChange={e=>void changeOrder(e.target.value)} required><SelectItem value="" text="选择真实订单"/>{orders.filter(o=>!['cancelled','closed'].includes(o.status)).map(o=><SelectItem key={o.id} value={o.id} text={o.order_number+' · '+(o.customers?.name||'未关联客户')}/>)}</SelectInput></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>装运方式<SelectInput value={shippingMode} onChange={e=>setShippingMode(e.target.value)}>{modes.map(m=><SelectItem key={m.value} value={m.value} text={m.label}/>)}</SelectInput></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>贸易术语<SelectInput value={incoterm} onChange={e=>setIncoterm(e.target.value)}>{['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(x=><SelectItem key={x} value={x} text={x}/>)}</SelectInput></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>负责人<TextInput value={responsibleName} onChange={e=>setResponsibleName(e.target.value)} placeholder="负责人姓名"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>起运港<TextInput value={originPort} onChange={e=>setOriginPort(e.target.value)} placeholder="港口 / 机场"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>目的港<TextInput value={destinationPort} onChange={e=>setDestinationPort(e.target.value)} placeholder="港口 / 机场"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>最晚装运日<TextInput type="date" value={latestShipDate} onChange={e=>setLatestShipDate(e.target.value)}/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>预计开船 / 起飞<TextInput type="date" value={etd} onChange={e=>setEtd(e.target.value)}/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>预计到港<TextInput type="date" value={eta} onChange={e=>setEta(e.target.value)}/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>收货人<TextInput value={consignee} onChange={e=>setConsignee(e.target.value)} placeholder="从客户信息带入，可调整"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>通知方<TextInput value={notifyParty} onChange={e=>setNotifyParty(e.target.value)} placeholder="通知方"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>订舱号<TextInput value={bookingNumber} onChange={e=>setBookingNumber(e.target.value)} placeholder="订舱确认后填写"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>提单号<TextInput value={billNumber} onChange={e=>setBillNumber(e.target.value)} placeholder="提单号"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>船名航次 / 航班<TextInput value={vesselVoyage} onChange={e=>setVesselVoyage(e.target.value)} placeholder="船名 / 航次"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>柜号<TextInput value={containerNumbers} onChange={e=>setContainerNumbers(e.target.value)} placeholder="多个柜号可用逗号分隔"/></label> </Column>
        <Column sm={4} md={4} lg={4} xlg={4}> <label>封条号<TextInput value={sealNumbers} onChange={e=>setSealNumbers(e.target.value)} placeholder="封条号"/></label> </Column>
      </Grid>
      <label className="shipment-form-wide">备注<TextAreaInput value={notes} onChange={e=>setNotes(e.target.value)} placeholder="本批出运备注"/></label>
      <h3>出运明细（数量不能超过订单剩余数量）</h3>
      {!orderId?<p className="shipments-empty">选择订单后读取真实订单明细。</p>:orderItems.length===0?<p className="shipments-empty">此订单暂无已登记的产品明细，不能创建出运单。请先在订单中补齐产品行。</p>:<div className="shipment-table-wrap"><Table className="shipment-table"><TableHead><TableRow><TableHeader>产品 / SKU</TableHeader><TableHeader>订单数量</TableHeader><TableHeader>已出运</TableHeader><TableHeader>本批数量</TableHeader><TableHeader>单位</TableHeader><TableHeader>毛重 kg</TableHeader><TableHeader>净重 kg</TableHeader><TableHeader>体积 m³</TableHeader><TableHeader>件数</TableHeader><TableHeader>包装</TableHeader><TableHeader>唛头</TableHeader></TableRow></TableHead><TableBody>{orderItems.map(item=><TableRow key={item.order_item_id}><TableCell>{item.product_name}<small>{item.sku||'—'}</small></TableCell><TableCell>{item.ordered_quantity}</TableCell><TableCell>{item.shipped_quantity}</TableCell><TableCell><TextInput aria-label={item.product_name+'本批出运数量'} type="number" min="0" max={item.ordered_quantity-item.shipped_quantity} step="any" value={item.quantity} onChange={e=>updateItem(item.order_item_id,'quantity',e.target.value)}/></TableCell><TableCell>{item.unit}</TableCell><TableCell><TextInput aria-label={item.product_name+'毛重'} type="number" min="0" value={item.gross_weight} onChange={e=>updateItem(item.order_item_id,'gross_weight',e.target.value)}/></TableCell><TableCell><TextInput aria-label={item.product_name+'净重'} type="number" min="0" value={item.net_weight} onChange={e=>updateItem(item.order_item_id,'net_weight',e.target.value)}/></TableCell><TableCell><TextInput aria-label={item.product_name+'体积'} type="number" min="0" value={item.volume_cbm} onChange={e=>updateItem(item.order_item_id,'volume_cbm',e.target.value)}/></TableCell><TableCell><TextInput aria-label={item.product_name+'件数'} type="number" min="0" value={item.package_count} onChange={e=>updateItem(item.order_item_id,'package_count',e.target.value)}/></TableCell><TableCell><TextInput aria-label={item.product_name+'包装方式'} value={item.packaging_method} onChange={e=>updateItem(item.order_item_id,'packaging_method',e.target.value)}/></TableCell><TableCell><TextInput aria-label={item.product_name+'唛头'} value={item.marks} onChange={e=>updateItem(item.order_item_id,'marks',e.target.value)}/></TableCell></TableRow>)}</TableBody></Table></div>}
      <footer><Button variant="secondary" type="button" onClick={()=>setCreateOpen(false)}>取消</Button><Button type="button" onClick={()=>createFormRef.current?.requestSubmit()} disabled={saving||!orderId||orderItems.every(i=>Number(i.quantity)<=0)}>{saving?'保存中…':'保存并生成出运单'}</Button></footer>
    </form></ModalBody>
    </Modal>}
  </div>;
}

function ShipmentItemsTable({shipmentId}:{shipmentId:string}) {
  const [items,setItems]=useState<Array<{id:string;product_name:string;sku:string|null;quantity:number;unit:string;gross_weight:number;net_weight:number;volume_cbm:number;package_count:number}>>([]);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;if(!supabase)return;void supabase.from('shipment_items').select('id,product_name,sku,quantity,unit,gross_weight,net_weight,volume_cbm,package_count').eq('shipment_id',shipmentId).order('created_at',{ascending:true}).then(({data,error:loadError})=>{if(!active)return;if(loadError)setError(loadError.message);else setItems((data??[]) as typeof items);});return()=>{active=false;};},[shipmentId]);
  if(error)return <TableRow><TableCell colSpan={7}>{error}</TableCell></TableRow>;
  if(!items.length)return <TableRow><TableCell colSpan={7}>暂无明细，或正在读取…</TableCell></TableRow>;
  return <>{items.map(i=><TableRow key={i.id}><TableCell>{i.product_name}</TableCell><TableCell>{i.sku||'—'}</TableCell><TableCell>{i.quantity} {i.unit}</TableCell><TableCell>{i.gross_weight||'—'}</TableCell><TableCell>{i.net_weight||'—'}</TableCell><TableCell>{i.volume_cbm||'—'}</TableCell><TableCell>{i.package_count||'—'}</TableCell></TableRow>)}</>;
}
