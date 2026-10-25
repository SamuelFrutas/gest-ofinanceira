document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("expenseForm");
  const button=form?.querySelector(".save-btn");
  if(!form||!button)return;

  button.type="button";
  button.addEventListener("click",()=>{
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }
    form.requestSubmit();
  });

  window.addEventListener("error",event=>{
    console.error("Erro no sistema:",event.error||event.message);
  });
});
