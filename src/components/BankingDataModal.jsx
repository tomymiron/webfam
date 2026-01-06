import { COLORS } from "../constants/theme";
import Icon from "../constants/Icon";
import "./styles/bankingDataModal.scss";

// Simple copy icon SVG
const CopyIcon = ({ size = 18, color = COLORS.blue_01 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 6.75H7.5C6.67157 6.75 6 7.42157 6 8.25V12.75C6 13.5784 6.67157 14.25 7.5 14.25H12C12.8284 14.25 13.5 13.5784 13.5 12.75V8.25C13.5 7.42157 12.8284 6.75 12 6.75Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 6.75V5.25C10.5 4.42157 9.82843 3.75 9 3.75H5.25C4.42157 3.75 3.75 4.42157 3.75 5.25V9C3.75 9.82843 4.42157 10.5 5.25 10.5H6.75" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function BankingDataModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const bankingData = {
    organization: "FEDERACION ATLETICA METROPOLITANA",
    accountType: "Cuenta Corriente",
    accountNumber: "014136/3007/5",
    bank: "BANCO DE GALICIA",
    branch: "Suc. Boedo",
    cbu: "0070007820000014136353",
    cuit: "30653097286",
    alias: "FEDERACION.ATLETICA"
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here if needed
      console.log(`${label} copiado al portapapeles`);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  };

  return (
    <div className="bankingDataModal-overlay" onClick={onClose}>
      <div className="bankingDataModal-container" onClick={(e) => e.stopPropagation()}>
        <button className="bankingDataModal-closeBtn" onClick={onClose}>
          <Icon name="close" size={24} color={COLORS.black_01} />
        </button>

        <div className="bankingDataModal-header">
          <div className="bankingDataModal-icon">
            <Icon name="tag" size={32} color={COLORS.blue_01} />
          </div>
          <h2 className="bankingDataModal-title">Datos Bancarios</h2>
          <p className="bankingDataModal-subtitle">
            Información para realizar transferencias y pagos
          </p>
        </div>

        <div className="bankingDataModal-content">
          <div className="bankingDataModal-organization">
            <p className="bankingDataModal-orgName">{bankingData.organization}</p>
          </div>

          <div className="bankingDataModal-dataGrid">
            <div className="bankingDataModal-dataItem">
              <div className="bankingDataModal-dataLabel">
                <Icon name="tag" size={16} color={COLORS.gray_01} />
                <span>Banco</span>
              </div>
              <div className="bankingDataModal-dataValue">
                {bankingData.bank}
              </div>
              <div className="bankingDataModal-dataSubValue">
                {bankingData.branch}
              </div>
            </div>

            <div className="bankingDataModal-dataItem">
              <div className="bankingDataModal-dataLabel">
                <Icon name="tag" size={16} color={COLORS.gray_01} />
                <span>Tipo de Cuenta</span>
              </div>
              <div className="bankingDataModal-dataValue">
                {bankingData.accountType}
              </div>
              <div className="bankingDataModal-dataSubValue">
                N° {bankingData.accountNumber}
              </div>
            </div>

            <div className="bankingDataModal-dataItem highlight">
              <div className="bankingDataModal-dataLabel">
                <Icon name="tag" size={16} color={COLORS.blue_01} />
                <span>CBU</span>
              </div>
              <div className="bankingDataModal-dataValue copyable" onClick={() => handleCopy(bankingData.cbu, "CBU")}>
                {bankingData.cbu}
                <CopyIcon size={18} color={COLORS.blue_01} />
              </div>
            </div>

            <div className="bankingDataModal-dataItem">
              <div className="bankingDataModal-dataLabel">
                <Icon name="tag" size={16} color={COLORS.gray_01} />
                <span>CUIT</span>
              </div>
              <div className="bankingDataModal-dataValue copyable" onClick={() => handleCopy(bankingData.cuit, "CUIT")}>
                {bankingData.cuit}
                <CopyIcon size={18} color={COLORS.blue_01} />
              </div>
            </div>

            <div className="bankingDataModal-dataItem highlight">
              <div className="bankingDataModal-dataLabel">
                <Icon name="tag" size={16} color={COLORS.blue_01} />
                <span>Alias</span>
              </div>
              <div className="bankingDataModal-dataValue copyable" onClick={() => handleCopy(bankingData.alias, "Alias")}>
                {bankingData.alias}
                <CopyIcon size={18} color={COLORS.blue_01} />
              </div>
            </div>
          </div>

          <div className="bankingDataModal-info">
            <Icon name="info" size={16} color={COLORS.blue_01} />
            <p>Haz clic en CBU, CUIT o Alias para copiarlo al portapapeles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

