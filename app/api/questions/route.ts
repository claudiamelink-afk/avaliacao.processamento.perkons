import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { questionSettings } from "../../../db/schema";
import { isAdmin, unauthorized } from "../../../lib/admin-auth";

type Question=[string,string[],number];
type OcrCase={image:string,correctPlate:string,ocrPlate:string,correctCategory:string,shownCategory:string};
type TestConfig={typingText:string,plates:string[],questions:Question[],ocrCases:OcrCase[],practical:{platePrompt:string,vehiclePrompt:string,infractionPrompt:string,validityPrompt:string,vehicleTypes:string[],infractionTypes:string[]}};
const validQuestions=(questions:unknown):questions is Question[]=>Array.isArray(questions)&&questions.length>0&&questions.every(item=>Array.isArray(item)&&typeof item[0]==="string"&&item[0].trim()&&Array.isArray(item[1])&&item[1].length===3&&item[1].every(x=>typeof x==="string"&&x.trim())&&Number.isInteger(item[2])&&item[2]>=0&&item[2]<3);
const valid=(config:unknown):config is TestConfig=>{if(!config||typeof config!=="object")return false;const c=config as TestConfig;return typeof c.typingText==="string"&&Boolean(c.typingText.trim())&&Array.isArray(c.plates)&&c.plates.length>0&&c.plates.every(x=>typeof x==="string"&&x.trim())&&validQuestions(c.questions)&&Array.isArray(c.ocrCases)&&c.ocrCases.length>0&&c.ocrCases.every(x=>x&&[x.image,x.correctPlate,x.ocrPlate,x.correctCategory,x.shownCategory].every(v=>typeof v==="string"&&v.trim()))&&Boolean(c.practical)&&[c.practical.platePrompt,c.practical.vehiclePrompt,c.practical.infractionPrompt,c.practical.validityPrompt].every(x=>typeof x==="string"&&x.trim())&&Array.isArray(c.practical.vehicleTypes)&&c.practical.vehicleTypes.length>0&&c.practical.vehicleTypes.every(x=>typeof x==="string"&&x.trim())&&Array.isArray(c.practical.infractionTypes)&&c.practical.infractionTypes.length>0&&c.practical.infractionTypes.every(x=>typeof x==="string"&&x.trim())};

export async function GET(){
 try{
  const [row]=await getDb().select().from(questionSettings).where(eq(questionSettings.id,1)).limit(1);
  if(!row)return Response.json({config:null});
  const saved=JSON.parse(row.questions);
  return Response.json(Array.isArray(saved)?{questions:saved,config:null}:{config:saved});
 }catch{return Response.json({config:null});}
}

export async function PUT(request:Request){
 try{
  if(!(await isAdmin(request)))return unauthorized();
  const data=await request.json() as {config?:unknown};
  if(!valid(data.config))return Response.json({error:"Revise os campos de todas as etapas antes de salvar."},{status:400});
  await getDb().insert(questionSettings).values({id:1,questions:JSON.stringify(data.config),updatedAt:new Date().toISOString()}).onConflictDoUpdate({target:questionSettings.id,set:{questions:JSON.stringify(data.config),updatedAt:new Date().toISOString()}});
  return Response.json({config:data.config});
 }catch{return Response.json({error:"Não foi possível salvar as perguntas."},{status:500});}
}
