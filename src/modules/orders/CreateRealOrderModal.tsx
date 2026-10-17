import { useEffect, useState } from 'react';
import { Add, WarningAlt } from '@carbon/icons-react';
import { Button } from '../../components/ui/Button';
import { SelectInput, SelectItem, TextInput } from '../../components/ui/Field';
import { supabase } from '../../lib/supabase';

type Customer = { id: string; name: string };
type OrderLineDraft = { product_name: string; sku: string; specification: string; quantity: string; unit: string; unit_price: string; note: string };
type Props = { onClose: () => void; onCreated: (orderNumber: string) => void };

export function CreateRealOrderModal({onClose,onCreated}:Props) {
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [orderNumber,setOrderNumber]=useState('SO-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-5));
  const [customerId,setCustomerId]=useState('');
  const [currency,setCurrency]=useState('USD');
  const [lines,setLines]=useState<OrderLineDraft[]>([{product_name:'',sku:'',specification:'',quantity:'1',unit:'件',unit_price:'0',note:''}]);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!supabase){setError('Supabase 尚未配置，无法创建真实订单。');return;}
    let active=true;
    void supabase.from('customers').select('id,name').eq('customer_type','customer').order('name').limit(500).then(({data,error:loadError})=>{
      if(!active)return;
      if(loadError)setError('读取客户失败：'+loadError.message);
      else setCustomers((data??[]) as Customer[]);
    });
    return ()=>{active=false;};
  },[]);
  const updateLine=(index:number,patch:Partial<OrderLineDraft>)=>setLines(prev=>prev.map((line,i)=>i===index?{...line,...patch}:line));
  const total=lines.reduce((sum,line)=>sum+(Number(line.quantity)||0)*(Number(line.unit_price)||0),0);
  const create=async()=>{
    if(!supabase||saving)return;
    if(!orderNumber.trim()||!customerId){setError('请填写订单编号并选择真实客户。');return;}
    if(!lines.length||lines.some(line=>!line.product_name.trim()||!Number.isFinite(Number(line.quantity))||Number(line.quantity)<=0||!Number.isFinite(Number(line.unit_price))||Number(line.unit_price)<0)){setError('每条产品行都必须填写产品名称、正数数量和非负单价。');return;}
    setSaving(true);setError('');
    const {data,error:saveError}=await supabase.rpc('create_order_with_items',{
      p_order_number:orderNumber.trim(),p_customer_id:customerId,p_currency_code:currency,p_total_amount:total,
      p_payment_terms:{source:'shipment-workflow',terms:'待补充正式付款条款'},
      p_items:lines.map(line=>({product_name:line.product_name.trim(),sku:line.sku.trim()||null,specification:line.specification.trim()||null,quantity:Number(line.quantity),unit:line.unit.trim()||'件',unit_price:Number(line.unit_price),note:line.note.trim()||null}))
    });
    setSaving(false);
    if(saveError){setError('创建真实订单失败：'+saveError.message);return;}
    const result=data as {order_number?:string}|null;
    onCreated(result?.order_number||orderNumber.trim());
  };
  return <div className="orders-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="orders-modal" role="dialog" aria-modal="true" aria-labelledby="real-order-title"><header><h3 id="real-order-title">新建真实订单</h3><Button variant="ghost" onClick={onClose}>关闭</Button></header><div className="orders-modal-body"><p>此流程会将订单头和产品明细写入 Supabase。只有保存成功的真实订单才会出现在出运单选择列表中。</p>{error&&<div className="orders-modal-warning" role="alert"><WarningAlt size={16}/>{error}</div>}<div className="orders-form-grid"><div className="carbon-field"><span className="carbon-field__label">订单编号 *</span><TextInput value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} labelText="订单编号" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">真实客户 *</span><SelectInput value={customerId} onChange={e=>setCustomerId(e.target.value)} labelText="真实客户" hideLabel><SelectItem value="" text="选择已建档客户"/>{customers.map(customer=><SelectItem key={customer.id} value={customer.id} text={customer.name}/>)}</SelectInput></div><div className="carbon-field"><span className="carbon-field__label">币种</span><SelectInput value={currency} onChange={e=>setCurrency(e.target.value)} labelText="币种" hideLabel>{['USD','EUR','GBP','CNY','JPY','HKD'].map(code=><SelectItem key={code} value={code} text={code}/>)}</SelectInput></div></div><h3>产品明细</h3>{lines.map((line,index)=><div className="orders-card" key={index}><header><h3>产品行 {index+1}</h3>{lines.length>1&&<Button size="sm" variant="ghost" onClick={()=>setLines(prev=>prev.filter((_,i)=>i!==index))}>移除</Button>}</header><div className="orders-form-grid"><div className="carbon-field"><span className="carbon-field__label">产品名称 *</span><TextInput value={line.product_name} onChange={e=>updateLine(index,{product_name:e.target.value})} labelText="产品名称" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">SKU</span><TextInput value={line.sku} onChange={e=>updateLine(index,{sku:e.target.value})} labelText="SKU" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">规格</span><TextInput value={line.specification} onChange={e=>updateLine(index,{specification:e.target.value})} labelText="规格" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">数量 *</span><TextInput type="number" min="0.001" step="0.001" value={line.quantity} onChange={e=>updateLine(index,{quantity:e.target.value})} labelText="数量" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">单位</span><TextInput value={line.unit} onChange={e=>updateLine(index,{unit:e.target.value})} labelText="单位" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">单价 *</span><TextInput type="number" min="0" step="0.0001" value={line.unit_price} onChange={e=>updateLine(index,{unit_price:e.target.value})} labelText="单价" hideLabel/></div><div className="carbon-field orders-full"><span className="carbon-field__label">备注</span><TextInput value={line.note} onChange={e=>updateLine(index,{note:e.target.value})} labelText="备注" hideLabel/></div></div></div>)}<Button variant="secondary" onClick={()=>setLines(prev=>[...prev,{product_name:'',sku:'',specification:'',quantity:'1',unit:'件',unit_price:'0',note:''}])}><Add size={16}/>添加产品行</Button><div className="orders-total-grand"><span>订单金额合计</span><b>{new Intl.NumberFormat('zh-CN',{style:'currency',currency,maximumFractionDigits:2}).format(total)}</b></div><div className="orders-modal-warning"><WarningAlt size={16}/>请确保客户、订单编号和产品数据准确。正式付款条款和订单审批仍需后续完善。</div></div><footer><Button variant="ghost" onClick={onClose}>取消</Button><Button disabled={saving||!customerId||!orderNumber.trim()} onClick={()=>void create()}>{saving?'保存中…':'创建真实订单'}</Button></footer></section></div>;
}
