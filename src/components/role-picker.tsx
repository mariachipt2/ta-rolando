"use client";
import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
  X,
  Check,
  Compass,
} from "lucide-react";
import { useNow } from "@/lib/use-now";
import type { Category, Event } from "@/lib/types";
import {
  pickEvents,
  pickerDefaults,
  type PickerAnswers,
} from "@/lib/role-picker";
import { EventCard } from "./event-card";
const questions = [
  {
    key: "when",
    title: "Quando você quer sair?",
    hint: "Escolha o período do seu próximo rolê.",
    options: [
      ["today", "Hoje", "A boa de agora"],
      ["tomorrow", "Amanhã", "Já deixa combinado"],
      ["weekend", "Fim de semana", "De sexta a domingo"],
      ["week", "Próximos 7 dias", "Planeje a semana"],
      ["all", "Qualquer dia", "Quero conhecer as opções"],
    ],
  },
  {
    key: "budget",
    title: "Quanto quer gastar na entrada?",
    hint: "O limite considera a entrada, sem consumo ou transporte.",
    options: [
      ["free", "Só gratuitos", "Sem cobrar entrada"],
      ["30", "Até R$ 30", "Entrada divulgada até esse valor"],
      ["60", "Até R$ 60", "Um pouco mais de opções"],
      ["any", "Sem limite definido", "Eu confiro o preço depois"],
    ],
  },
  {
    key: "vibe",
    title: "Qual é a sua vibe?",
    hint: "Escolha o que combina com seu momento.",
    options: [
      ["any", "Me surpreenda", "Todos os tipos de rolê"],
      ["music", "Shows e música", "Para curtir um som"],
      ["nightlife", "Bares e festas", "Para encontrar a turma"],
      ["culture", "Cultura e cinema", "Para sair da rotina"],
      ["family", "Com crianças", "Só os cadastrados para crianças"],
      ["faith", "Eventos religiosos", "Um encontro de fé"],
    ],
  },
] as const;
export function RolePicker({
  events,
  categories,
  error = false,
}: {
  events: Event[];
  categories: Category[];
  error?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [step, setStep] = useState(0),
    [answers, setAnswers] = useState<PickerAnswers>(pickerDefaults);
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    id = useId(),
    reduced = useReducedMotion(),
    now = useNow();
  useEffect(() => {
    if (!open) return;
    const el = dialog.current;
    if (!el) return;
    const overflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      trigger.current?.focus();
    };
  }, [open]);
  useEffect(() => {
    if (open) {
      heading.current?.focus();
      if (dialog.current) dialog.current.scrollTop = 0;
    }
  }, [open, step]);
  const results = pickEvents(events, answers, new Date(now), categories),
    question = questions[step];
  const close = () => setOpen(false);
  return (
    <section className="role-picker-feature" aria-labelledby={id + "-banner"}>
      <div className="role-picker-orbit" aria-hidden="true">
        <Compass size={30} />
        <span>?</span>
      </div>
      <div className="role-picker-intro">
        <span className="eyebrow">SEU PRÓXIMO ROLÊ COMEÇA AQUI</span>
        <h2 id={id + "-banner"}>Tá na dúvida? A gente ajuda.</h2>
        <p>3 respostas rápidas. Até 3 ideias para você sair da rotina.</p>
      </div>
      <button
        ref={trigger}
        type="button"
        className="button role-picker-cta"
        aria-haspopup="dialog"
        onClick={() => {
          setStep(0);
          setAnswers(pickerDefaults);
          setOpen(true);
        }}
      >
        Me ajuda a escolher <ArrowUpRight size={19} />
      </button>
      {open && (
        <dialog
          ref={dialog}
          className={
            "role-picker-dialog" + (step === 3 ? " showing-results" : "")
          }
          aria-labelledby={id + "-title"}
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="role-picker-dialog-top">
            <span>
              <Sparkles size={16} /> ME AJUDA A ESCOLHER
            </span>
            <button
              className="role-picker-close"
              type="button"
              aria-label="Fechar ajuda para escolher"
              onClick={close}
            >
              <X size={21} />
            </button>
          </div>
          <div
            className="role-picker-progress"
            aria-label={
              step < 3 ? `Pergunta ${step + 1} de 3` : "Respostas concluídas"
            }
          >
            {[0, 1, 2].map((n) => (
              <span key={n} className={n <= step ? "is-filled" : ""} />
            ))}
          </div>
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
          >
            <p className="role-picker-step" aria-live="polite">
              {step < 3 ? `PERGUNTA ${step + 1} DE 3` : "SUAS IDEIAS DE ROLÊ"}
            </p>
            <h2 ref={heading} tabIndex={-1} id={id + "-title"}>
              {question?.title || "Encontramos sua próxima boa?"}
            </h2>
            {question ? (
              <>
                <p className="role-picker-hint">{question.hint}</p>
                <div
                  className="role-picker-options"
                  role="group"
                  aria-label={question.title}
                >
                  {question.options.map(([value, label, detail]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={answers[question.key] === value}
                      onClick={() => {
                        setAnswers((old) => ({
                          ...old,
                          [question.key]: value,
                        }));
                        setStep((n) => n + 1);
                      }}
                    >
                      <span>
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </span>
                      {answers[question.key] === value ? (
                        <Check size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </button>
                  ))}
                </div>
                {step === 1 && (
                  <p className="role-picker-footnote">
                    Preços não informados ou com condições especiais ficam fora
                    dos limites de R$ 30 e R$ 60.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="role-picker-answer-summary">
                  {questions.map((q) => (
                    <button
                      type="button"
                      key={q.key}
                      onClick={() => setStep(questions.indexOf(q))}
                    >
                      {q.options.find((o) => o[0] === answers[q.key])?.[1]}
                    </button>
                  ))}
                </div>
                {error ? (
                  <div className="role-picker-empty" role="status">
                    <Compass size={30} />
                    <h3>A agenda não carregou desta vez.</h3>
                    <p>
                      Feche esta janela e atualize o site para consultar os
                      eventos.
                    </p>
                  </div>
                ) : results.length ? (
                  <>
                    <p className="role-picker-hint">
                      {results.length === 1
                        ? "Esta opção combina"
                        : "Estas opções combinam"}{" "}
                      com suas respostas. Confira os detalhes antes de sair.
                    </p>
                    <div className="role-picker-results">
                      {results.map(({ event, reasons }) => (
                        <div key={event.id}>
                          <div className="role-picker-reasons">
                            {reasons.map((reason) => (
                              <span key={reason}>
                                <Check size={12} />
                                {reason}
                              </span>
                            ))}
                          </div>
                          <EventCard event={event} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="role-picker-empty" role="status">
                    <Compass size={30} />
                    <h3>Ainda não achei essa combinação.</h3>
                    <p>
                      Tente outro período, orçamento ou tipo de rolê. Não
                      trocamos suas preferências por opções diferentes.
                    </p>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setStep(0)}
                    >
                      Mudar minhas respostas
                    </button>
                  </div>
                )}
                <p className="role-picker-footnote">
                  Sugestões com base nos cadastros da agenda. Entrada,
                  disponibilidade e programação podem mudar.
                </p>
              </>
            )}
          </motion.div>
          <div className="role-picker-footer">
            {step > 0 && (
              <button
                type="button"
                className="role-picker-back"
                onClick={() => setStep((n) => n - 1)}
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
            )}
            {step === 3 && (
              <button
                className="role-picker-back"
                type="button"
                onClick={() => {
                  setAnswers(pickerDefaults);
                  setStep(0);
                }}
              >
                Começar de novo
              </button>
            )}
          </div>
        </dialog>
      )}
    </section>
  );
}
