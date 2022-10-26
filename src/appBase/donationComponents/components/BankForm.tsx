import React from "react";
import { FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material"
import { useStripe } from "@stripe/react-stripe-js";
import { InputBox, ErrorMessages } from "../../components";
import { ApiHelper } from "../../helpers";
import { PersonInterface, StripePaymentMethod, PaymentMethodInterface, StripeBankAccountInterface, StripeBankAccountUpdateInterface, StripeBankAccountVerifyInterface } from "../../interfaces";

interface Props { bank: StripePaymentMethod, showVerifyForm: boolean, customerId: string, person: PersonInterface, setMode: any, deletePayment: any, updateList: (message?: string) => void }

export const BankForm: React.FC<Props> = (props) => {
  const stripe = useStripe();
  const [bankAccount, setBankAccount] = React.useState<StripeBankAccountInterface>({ account_holder_name: props.bank.account_holder_name, account_holder_type: props.bank.account_holder_type, country: "US", currency: "usd" } as StripeBankAccountInterface);
  const [paymentMethod] = React.useState<PaymentMethodInterface>({ customerId: props.customerId, personId: props.person.id, email: props.person.contactInfo.email, name: props.person.name.display });
  const [updateBankData] = React.useState<StripeBankAccountUpdateInterface>({ paymentMethodId: props.bank.id, customerId: props.customerId, personId: props.person.id, bankData: { account_holder_name: props.bank.account_holder_name, account_holder_type: props.bank.account_holder_type } } as StripeBankAccountUpdateInterface);
  const [verifyBankData, setVerifyBankData] = React.useState<StripeBankAccountVerifyInterface>({ paymentMethodId: props.bank.id, customerId: props.customerId, amountData: { amounts: [] } });
  const [showSave, setShowSave] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string>(null);
  const saveDisabled = () => { }
  const handleCancel = () => { props.setMode("display"); }
  const handleDelete = () => { props.deletePayment(); }
  const handleSave = () => {
    setShowSave(false);
    if (props.showVerifyForm) verifyBank();
    else props.bank.id ? updateBank() : createBank();
  }

  const createBank = async () => {
    if (!bankAccount.routing_number || !bankAccount.account_number) setErrorMessage("Routing and account number are required.")
    else {
      await stripe.createToken("bank_account", bankAccount).then(response => {
        if (response?.error?.message) setErrorMessage(response.error.message);
        else {
          const pm = { ...paymentMethod };
          pm.id = response.token.id;
          ApiHelper.post("/paymentmethods/addbankaccount", pm, "GivingApi").then(result => {
            if (result?.raw?.message) setErrorMessage(result.raw.message);
            else {
              props.updateList("Bank account added. Verify your bank account to make a donation.");
              props.setMode("display");
            }
          });
        }
      });
    }
    setShowSave(true);
  }

  const updateBank = () => {
    if (bankAccount.account_holder_name === "") setErrorMessage("Account holder name is required.");
    else {
      let bank = { ...updateBankData };
      bank.bankData.account_holder_name = bankAccount.account_holder_name;
      bank.bankData.account_holder_type = bankAccount.account_holder_type;
      ApiHelper.post("/paymentmethods/updatebank", bank, "GivingApi").then(response => {
        if (response?.raw?.message) setErrorMessage(response.raw.message);
        else {
          props.updateList("Bank account updated.");
          props.setMode("display");
        }
      });
    }
    setShowSave(true);
  }

  const verifyBank = () => {
    const amounts = verifyBankData?.amountData?.amounts;
    if (amounts && amounts.length === 2 && amounts[0] !== "" && amounts[1] !== "") {
      ApiHelper.post("/paymentmethods/verifyBank", verifyBankData, "GivingApi").then(response => {
        if (response?.raw?.message) setErrorMessage(response.raw.message);
        else {
          props.updateList("Bank account verified.");
          props.setMode("display");
        }
      });
    }
    else setErrorMessage("Both deposit amounts are required.");
    setShowSave(true);
  }

  const getHeaderText = () => props.bank.id
    ? `${props.bank.name.toUpperCase()} ****${props.bank.last4}`
    : "Add New Bank Account"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const bankData = { ...bankAccount };
    const inputData = { [e.target.name]: e.target.value };
    setBankAccount({ ...bankData, ...inputData });
    setShowSave(true);
  }

  const handleKeyPress = (e: React.KeyboardEvent<any>) => {
    const pattern = /^\d+$/;
    if (!pattern.test(e.key)) e.preventDefault();
  }

  const handleVerify = (e: React.ChangeEvent<HTMLInputElement>) => {
    const verifyData = { ...verifyBankData };
    if (e.currentTarget.name === "amount1") verifyData.amountData.amounts[0] = e.currentTarget.value;
    if (e.currentTarget.name === "amount2") verifyData.amountData.amounts[1] = e.currentTarget.value;
    setVerifyBankData(verifyData);
  }

  const getForm = () => {
    if (props.showVerifyForm) {
      return (<>
        <p>Enter the two deposits you received in your account to finish verifying your bank account.</p>
        <Grid container columnSpacing={2}>
          <Grid item md={6} xs={12}>
            <TextField fullWidth aria-label="amount1" label="First Deposit" name="amount1" placeholder="00" inputProps={{ maxLength: 2 }} onChange={handleVerify} onKeyPress={handleKeyPress} />
          </Grid>
          <Grid item md={6} xs={12}>
            <TextField fullWidth aria-label="amount2" label="Second Deposit" name="amount2" placeholder="00" inputProps={{ maxLength: 2 }} onChange={handleVerify} onKeyPress={handleKeyPress} />
          </Grid>
        </Grid>
      </>);

    } else {
      let accountDetails = <></>
      if (!props.bank.id) accountDetails = (
        <Grid container spacing={3}>
          <Grid item md={6} xs={12} style={{ marginBottom: "20px" }}>
            <TextField fullWidth label="Routing Number" type="number" name="routing_number" aria-label="routing-number" placeholder="Routing Number" className="form-control" onChange={handleChange} />
          </Grid>
          <Grid item md={6} xs={12} style={{ marginBottom: "20px" }}>
            <TextField fullWidth label="Account Number" type="number" name="account_number" aria-label="account-number" placeholder="Account Number" className="form-control" onChange={handleChange} />
          </Grid>
        </Grid>
      );
      return (<>
        <Grid container spacing={3}>
          <Grid item md={6} xs={12} style={{ marginBottom: "20px" }}>
            <TextField fullWidth label="Account Holder Name" name="account_holder_name" required aria-label="account-holder-name" placeholder="Account Holder Name" value={bankAccount.account_holder_name} className="form-control" onChange={handleChange} />
          </Grid>
          <Grid item md={6} xs={12} style={{ marginBottom: "20px" }}>
            <FormControl fullWidth>
              <InputLabel>Account Holder Type</InputLabel>
              <Select label="Account Holder Type" name="account_holder_type" aria-label="account-holder-type" value={bankAccount.account_holder_type} onChange={handleChange}>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="company">Company</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        {accountDetails}
      </>);
    }
  }

  return (
    <InputBox headerIcon="volunteer_activism" headerText={getHeaderText()} ariaLabelSave="save-button" ariaLabelDelete="delete-button" cancelFunction={handleCancel} saveFunction={showSave ? handleSave : saveDisabled} deleteFunction={props.bank.id && !props.showVerifyForm ? handleDelete : undefined}>
      {errorMessage && <ErrorMessages errors={[errorMessage]}></ErrorMessages>}
      <div>
        {!props.bank.id && <p>Bank accounts will need to be verified before making any donations. Your account will receive two small deposits in approximately 1-3 business days. You will need to enter those deposit amounts to finish verifying your account by selecting the verify account link next to your bank account under the payment methods section.</p>}
        {getForm()}
      </div>
    </InputBox>
  );

}
