// Local visual QA only. This server substitutes fixtures in memory; it does not
// change application files, production auth, or the Firebase database.
import { createServer } from 'vite';
const fixture = `
const now = { seconds: Math.floor(Date.now()/1000), toDate: () => new Date() };
const students = [
 { id:'s1',studentId:'STU001',name:'Aarav Kumar',classType:'Beginner',location:'Kandrika',fatherName:'Ravi Kumar',motherName:'Anita Kumar',dollarPoints:55,rewards:[{dollars:55,date:'2026-11-24',reason:'Completed homework',teacher:'Mary Joseph'}],attendance:[],absentDates:[],currentStreak:2 },
 { id:'s2',studentId:'STU002',name:'Diya Rao',classType:'Primary',location:'Krishna Lanka',dollarPoints:49,rewards:[],attendance:[],absentDates:[],currentStreak:1 },
 { id:'s3',studentId:'STU003',name:'Joel Thomas',classType:'Secondary',location:'Gandhiji Conly',dollarPoints:44,rewards:[],attendance:[],absentDates:[],currentStreak:0 },
];
const tables = { students, teachers:[{id:'t1',uid:'t1',name:'Mary Joseph',email:'mary@example.com',phone:'0000000000',subject:'General',isVerified:true,approvalState:'approved',points:15},{id:'t2',uid:'t2',name:'Daniel Paul',email:'daniel@example.com',phone:'0000000000',isVerified:false,approvalState:'pending'}], notifications:[{id:'n1',title:'Sunday Class Reminder',message:'Please arrive 10 minutes before your scheduled class.',audience:'All',createdAt:now}], complaints:[], parents:[{id:'p1',name:'Anita Kumar',email:'anita@example.com',studentName:'Aarav Kumar',studentId:'STU001',phone:'0000000000'}], timetables:[], offerings:[], expenses:[], financial_records:[] };
export const db={}; export const auth={currentUser:{uid:'fixture-admin',displayName:'Admin'}};
export const messagingPromise=Promise.resolve(null); export default {};
const snapshot = ref => { const data=tables[ref?.path?.split('/')[0]]||[]; const docs=data.map(row=>({id:row.id,data:()=>row,exists:()=>true})); return {docs,empty:!docs.length,size:docs.length,metadata:{fromCache:false},forEach:fn=>docs.forEach(fn),docChanges:()=>docs.map(doc=>({type:'added',doc})),data:()=>undefined,exists:()=>false}; };
export const collection=(...args)=>({path:args.filter(v=>typeof v==='string').join('/')});
export const doc=(...args)=>({path:args.filter(v=>typeof v==='string').join('/'),id:args.at(-1)});
export const query=ref=>ref;
export const where=(...args)=>args; export const orderBy=(...args)=>args; export const limit=(...args)=>args;
export const onSnapshot=(ref,next)=>{let active=true;queueMicrotask(()=>{if(active)next(snapshot(ref));});return()=>{active=false;};};
export const getDocs=async ref=>snapshot(ref); export const getDoc=async ref=>snapshot(ref);
const blocked=async()=>{throw new Error('Visual QA is read-only. No database writes are allowed.');};
export const addDoc=blocked;export const updateDoc=blocked;export const deleteDoc=blocked;export const setDoc=blocked;export const mutateStudent=blocked;
export const runTransaction=blocked;export const startNewActivityPeriod=blocked;
export const writeBatch=()=>({update(){},set(){},delete(){},commit:blocked});
export const serverTimestamp=()=>now;export const arrayUnion=(...args)=>args;export const arrayRemove=(...args)=>args;export const increment=n=>n;
export const deleteField=()=>null;export const limitToLast=(...args)=>args;export const startAfter=(...args)=>args;
export const websitePeriodsEnabled=false;export const setActivePeriod=()=>{};export const periodSettingsRef=()=>({});
export const Timestamp={fromDate:date=>({toDate:()=>date})};
`;
const mockAuth = `import React from 'react';
const user={uid:'fixture-admin',name:'Admin',email:'admin@example.com',role:'ADMIN'};
export const useAuth=()=>({currentUser:user,firebaseUser:user,loading:false,error:null,clearError(){},logout:async()=>{},refreshUserProfile:async()=>{}});
export const AuthProvider=({children})=>children;`;
const mockNotifications = `export const retryNotifications=async()=>{};export const notifySuccess=async()=>{};export const notifyError=async()=>{};export const requestNotificationPermission=async()=>false;export const registerPushTokenForUser=async()=>{};export const listenForForegroundPushMessages=async()=>()=>{};export const showAppNotification=async()=>{};`;
const server=await createServer({ server: { host:'127.0.0.1',port:5175,strictPort:true }, plugins:[{name:'read-only-admin-fixtures',enforce:'pre',load(id){
 const file=id.replaceAll('\\','/').split('?')[0];
 if(file.endsWith('/src/contexts/AuthContext.jsx'))return mockAuth;
 if(['/src/services/studentData.js','/src/services/notifyingFirestore.js','/src/config/firebase.js'].some(path=>file.endsWith(path)))return fixture;
 if(file.endsWith('/src/services/notificationService.js'))return mockNotifications;
}}] });
await server.listen(); server.printUrls();
