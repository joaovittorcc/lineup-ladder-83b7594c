-- Registrar W.O.: Lunatic venceu Wartzel e subiu para 2º na Lista 02

INSERT INTO public.global_logs (
  type,
  description,
  player_one,
  player_two,
  winner,
  category,
  created_at
) VALUES (
  'CHALLENGE',
  'Lunatic venceu Wartzel por W.O. e subiu para 2º na Lista 02!',
  'Lunatic',
  'Wartzel',
  'Lunatic',
  'list-02',
  NOW()
);
