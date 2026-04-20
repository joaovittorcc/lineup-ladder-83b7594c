-- Enviar notificação W.O. para Discord
SELECT 
  net.http_post(
    url := 'https://discord.com/api/webhooks/1493812023945990164/ZFlnDQ2tjPL_36YPhz-YyokuqxFO77ZXcB7eMhIrlkf7-FkC57UiQNzkEJ8U3SKYcp9X',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'embeds', jsonb_build_array(
        jsonb_build_object(
          'title', '🏁 Vitória por W.O.',
          'description', '**Lunatic** venceu **Wartzel** por W.O. e subiu para **2º na Lista 02**!',
          'color', 16776960,
          'timestamp', now()
        )
      )
    )
  );
