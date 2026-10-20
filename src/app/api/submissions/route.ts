import { service } from "@/lib/supabase";
import { visitor, sameOrigin, verifyBot, limit } from "@/lib/visitor";
import { validateSubmission } from "@/lib/submission-validation";
import {photoType} from '../../../../supabase/functions/_shared/photos';
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return Response.json({ error: "Origem inválida." }, { status: 403 });
    const multipart=req.headers.get('content-type')?.includes('multipart/form-data');
    if(Number(req.headers.get('content-length')||0)>6291456)return Response.json({error:'Arquivo muito grande.'},{status:413});
    let photo:File|null=null;let body;
    if(multipart){const form=await req.formData();body=JSON.parse(String(form.get('payload')||''));const file=form.get('photo');if(file instanceof File&&file.size)photo=file}else body=await req.json();
    if (
      typeof body.request_id !== "string" ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(body.request_id)
    )
      return Response.json({ error: "Envio inválido." }, { status: 400 });
    const event = validateSubmission(body.event);
    if (!(await verifyBot(body.token || "")))
      return Response.json(
        { error: "Complete a verificação de segurança." },
        { status: 403 },
      );
    const hash = await visitor(true);
    if (!(await limit("submissions:" + hash, 5, 3600)))
      return Response.json(
        { error: "Limite de envios atingido. Tente mais tarde." },
        { status: 429 },
      );
    const db = service();
    const { data: category } = await db
      .from("categories")
      .select("id")
      .eq("id", event.category_id)
      .eq("active", true)
      .maybeSingle();
    if (!category)
      return Response.json(
        { error: "Escolha uma categoria ativa." },
        { status: 400 },
      );
    const existing=await db.from('event_submissions').select('id,visitor_hash,submitted_at').eq('id',body.request_id).maybeSingle();if(existing.error)throw existing.error;if(existing.data){if(existing.data.visitor_hash!==hash)throw Error('Envio inválido.');return Response.json({id:existing.data.id,saved_at:existing.data.submitted_at})}
    let photo_path:string|null=null;
    if(photo){const bytes=new Uint8Array(await photo.arrayBuffer()),type=photoType(bytes);photo_path=body.request_id+'/cover.'+type.ext;const uploaded=await db.storage.from('submission-images').upload(photo_path,bytes,{contentType:type.mime,upsert:true});if(uploaded.error)throw uploaded.error}
    const { error } = await db
      .from("event_submissions")
      .upsert(
        { id: body.request_id, visitor_hash: hash, event_data: event,photo_path },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (error) throw error;
    const { data, error: readError } = await db
      .from("event_submissions")
      .select("id,submitted_at")
      .eq("id", body.request_id)
      .eq("visitor_hash", hash)
      .single();
    if (readError) throw readError;
    return Response.json(
      { id: data.id, saved_at: data.submitted_at },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Não foi possível confirmar o envio.",
      },
      { status: 400 },
    );
  }
}
