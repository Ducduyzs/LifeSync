let timeLeft = 60;
const btn = document.getElementById("resendBtn");
const cd = document.getElementById("countdown");

if (btn && cd) {
  const timer = setInterval(() => {
    timeLeft--;
    cd.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.textContent = "Resend OTP";
    }
  }, 1000);

  btn.addEventListener("click", async () => {
    btn.disabled = true;

    const email = btn.dataset.email;

    const res = await fetch("/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    showToast(data.message, data.type);

    timeLeft = 60;
    cd.textContent = timeLeft;

    const t = setInterval(() => {
      timeLeft--;
      cd.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(t);
        btn.disabled = false;
        btn.textContent = "Resend OTP";
      }
    }, 1000);
  });
}
