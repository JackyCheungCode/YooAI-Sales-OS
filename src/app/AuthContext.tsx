import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
type AuthValue={session:Session|null;loading:boolean;signIn:(email:string,password:string)=>Promise<string|null>;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}){const [session,setSession]=useState<Session|null>(null);const [loading,setLoading]=useState(true);useEffect(()=>{if(!supabase){setLoading(false);return}let active=true;supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)}).finally(()=>{if(active)setLoading(false)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>setSession(nextSession));return()=>{active=false;subscription.unsubscribe()}},[]);const signIn=async(email:string,password:string)=>{if(!supabase)return '请先配置 Supabase 环境变量。';const {error}=await supabase.auth.signInWithPassword({email,password});return error?.message??null};const signOut=async()=>{if(supabase)await supabase.auth.signOut()};return <AuthContext.Provider value={{session,loading,signIn,signOut}}>{children}</AuthContext.Provider>}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value}
