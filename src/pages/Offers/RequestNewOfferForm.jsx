import React, { useEffect, useState } from "react";
import styled from "styled-components";
import "react-phone-number-input/style.css";
import { Col, Header, Row } from "../../components/Shared";

import Layout from "../../components/Layout";
import { BsChevronLeft, BsCamera } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import offerImage from "../../assets/offerImage.png";
import ModalContainer from "../../components/Modal";
import {
  Form,
  Input,
  InputGrp,
  Label,
  SSelect,
  PrimaryBtn,
  TextArea,
} from "../../components/FormComponents";
import SuccessModal from "../../components/Shared/SuccessModal";
import { useAtom } from "jotai";
import { userAtom, userTokenAtom } from "../../store/Atoms";
import axios from "axios";
// import checkmark from "../../assets/checkmark.png";
import DateRangePickerV2 from "../../components/DateRangePickerV2";
import moment from "moment";
import { APIsConstants } from "../../constants/API.constants";
import Loader from "../../components/loader";
import { storage } from "../../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { v4 } from "uuid";
const offerTypes = [
  {
    value: "discount",
    label: "Discount",
  },
  {
    value: "gift",
    label: "Gift",
  },
  {
    value: "giftCard",
    label: "Gift Card",
  },
];

const DiscountTypes = [
  {
    value: "percent",
    label: "Percentage",
  },
  {
    value: "flat",
    label: "Flat",
  },
];

export default function RequestNewOfferForm() {
  // const [offerType, setOfferType] = useState(offerTypes[0]);
  const [doneModal, setDoneModal] = useState(false);
  const nav = useNavigate();
  const [branches, setBranches] = useState([]);
  const [token, setToken] = useAtom(userTokenAtom);
  const [user, setUser] = useAtom(userAtom);

  const [selectedImageURL, setSelectedImageURL] = useState();
  const [selectedDate, setSelectedDate] = useState({
    fromDate: moment().date(-90).format("YYYY-MM-DD"),
    toDate: moment().format("YYYY-MM-DD"),
  });
  const [name, setName] = useState(null);
  const [offerCap, setOfferCap] = useState(null);
  const [discountValue, setDiscountValue] = useState(null);
  const [discountType, setDiscountType] = useState(DiscountTypes[0]);
  const [originalPrice, setOriginalPrice] = useState(null);
  const [offerType, setOfferType] = useState(offerTypes[0]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [description, setDescription] = useState(null);
  const [applicability, setApplicability] = useState(null);
  ///
  const [mainProductName, setMainProductName] = useState(null);
  const [selectedGiftValue, setSelectedGiftValue] = useState(null);
  const [giftCardValue, setGiftCardValue] = useState(null);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageName, setImageName] = useState(null);

  const onSelectFile = (event) => {
    const selectedFiles = event.target.files;
    let imageName = selectedFiles[0].name + v4();
    setImageName(imageName);
    const imageRef = ref(storage, `images/${imageName}`);
    uploadBytes(imageRef, selectedFiles[0]).then(() =>
      getDownloadURL(imageRef, selectedFiles[0]).then((e) =>
        setSelectedImageURL(e)
      )
    );
  };

  function deleteHandler() {
    const desertRef = ref(storage, `images/${imageName}`);

    // Delete the file
    deleteObject(desertRef)
      .then(() => {
        // File deleted successfully
      })
      .catch((error) => {
        // Uh-oh, an error occurred!
      });

    setSelectedImageURL(null);
  }

  const CreateOffer = () => {
    setLoading(true);
    let data = {
      name: name,
      offerType: offerType.value,
      description: description,
      applicability: applicability,
      discountType: discountType.value,
      discountValue: discountValue,
      originalPrice: originalPrice,
      offerCap: offerCap,
      offerImage: selectedImageURL,
      applicableBranches: [selectedBranch.value],
      startDate: selectedDate.fromDate,
      endDate: selectedDate.toDate,
    };
    if (offerType.value === "gift") {
      data = {
        name: name,
        offerType: offerType,
        description: description,
        applicability: applicability,
        mainProductName: mainProductName,
        giftValue: giftValue,
        offerImage: selectedImageURL,
        redeemDuration: 30,
        applicableBranches: [selectedBranch.value],
        startDate: "2023-05-23T23:00:00",
        endDate: "2023-05-30T23:00:00",
      };
    }

    axios
      .post(`${APIsConstants.BASE_URL}/deals`, data, {
        headers: {
          "Content-Type": "application/json",
          apiKey: "63cad87c3207fce093f8c08388e5a805",
          Authorization: `Bearer ${token?.accessToken}`,
        },
      })
      .then((res) => {
        setLoading(false);
        setDoneModal(true);
        setError("");
      })
      .catch((error) => {
        setLoading(false);
        if (error.response.status === 401) {
          setToken(null);
          setUser(null);
        } else {
          setError(error.response.data.message);
        }
      });
  };

  const getBranches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://qoodz-api.herokuapp.com/api/branches",
        {
          headers: {
            "Content-Type": "application/json",
            apiKey: "63cad87c3207fce093f8c08388e5a805",
            Authorization: `Bearer ${token.accessToken}`,
          },
        }
      );
      setLoading(false);
      return res.data;
    } catch (error) {
      setLoading(false);
      if (error.response.status === 401) {
        setToken(null);
        setUser(null);
      }
    }
  };

  //A function that creates dropdown options from the branches label is the name and id is the value
  const createOptions = (branches) => {
    const options = branches.map((branch) => {
      return { label: branch.name, value: branch.id };
    });
    return options;
  };

  const onBranchChange = (e) => {
    console.log("e: ", e);
    setSelectedBranch(e);
  };

  useEffect(() => {
    getBranches().then((res) => {
      setBranches(createOptions(res));
    });
  }, []);

  const onSubmit = () => {
    CreateOffer();
  };

  const onModalClosed = () => {
    setDoneModal(false);
    nav(-1);
  };
  const isDisabled = () => {
    if (offerType.value === "discount") {
      if (
        name &&
        offerCap &&
        discountValue &&
        discountType &&
        originalPrice &&
        offerType &&
        selectedBranch &&
        description &&
        applicability &&
        selectedDate
      ) {
        return false;
      } else {
        return true;
      }
    } else if (offerType.value === "gift") {
      if (
        name &&
        selectedImageURL &&
        discountType &&
        description &&
        mainProductName &&
        selectedDate &&
        offerType &&
        applicability
      ) {
        return false;
      } else {
        return true;
      }
    } else if (offerType.value === "giftCard") {
      if (name && selectedImageURL && giftCardValue) {
        return false;
      } else {
        return true;
      }
    }
  };

  const renderGiftCardForm = () => {
    return (
      <Form style={{ padding: "16px", maxWidth: "520px" }}>
        <Col gap="22px">
          <Label>Offer Image</Label>
          {!selectedImageURL && (
            <>
              <UploadOfferImage>
                <UploadImageBadege>
                  <BsCamera />
                </UploadImageBadege>
                <input
                  type="file"
                  name="images"
                  id="actual-btn"
                  onChange={onSelectFile}
                  accept="image/png , image/jpeg, image/webp"
                />
                <label for="actual-btn">Choose File</label>
              </UploadOfferImage>
            </>
          )}
          {selectedImageURL && (
            <CurrentImageContainer>
              <OfferImgContainer onClick={() => deleteHandler()}>
                <OfferImg src={selectedImageURL} height="200" alt="upload" />
              </OfferImgContainer>
              <DetleteBtn style={{}} skelaton onClick={() => deleteHandler()}>
                Delete
              </DetleteBtn>
            </CurrentImageContainer>
          )}
        </Col>
        <Row style={{ justifyContent: "flex-start" }} gap="16px">
          <InputGrp>
            <Label>Offer Name</Label>
            <Input type={"text"} onChange={(e) => setName(e.target.value)} />
          </InputGrp>
          <InputGrp>
            <Label>Offer Type</Label>
            <SSelect
              className="select-filter"
              classNamePrefix="filter-opt"
              options={offerTypes}
              onChange={(value) => setOfferType(value)}
            />
          </InputGrp>
        </Row>

        <InputGrp>
          <Label>Gift Card Value</Label>
          <Input
            type={"number"}
            onChange={(e) => setGiftCardValue(e.target.value)}
          />
        </InputGrp>

        {error && <Error>{error}</Error>}

        <PrimaryBtn disabled={isDisabled()} onClick={() => onSubmit()}>
          Request Offer
        </PrimaryBtn>
      </Form>
    );
  };

  return (
    <Layout>
      {loading ? <Loader /> : null}
      {doneModal && (
        <ModalContainer setOpen={onModalClosed}>
          <SuccessModal mainText="Your request has been sent Successfully!" />
        </ModalContainer>
      )}

      <Col master paddingHorz={"30px"} paddingVert={".2rem"} gap={"32px"}>
        <Header
          style={{ fontFamily: "GilroyBold" }}
          marginVert={"18px"}
          onClick={() => nav("/offers")}
        >
          <BsChevronLeft /> Offers
        </Header>
        {offerType.value == "giftCard" ? (
          renderGiftCardForm()
        ) : (
          <Form style={{ padding: "16px", maxWidth: "520px" }}>
            <Col gap="22px">
              <Label>Offer Image</Label>
              {!selectedImageURL && (
                <>
                  <UploadOfferImage>
                    <UploadImageBadege>
                      <BsCamera />
                    </UploadImageBadege>
                    <input
                      type="file"
                      name="images"
                      id="actual-btn"
                      onChange={onSelectFile}
                      accept="image/png , image/jpeg, image/webp"
                    />
                    <label for="actual-btn">Choose File</label>
                  </UploadOfferImage>
                </>
              )}
              {selectedImageURL && (
                <CurrentImageContainer>
                  <OfferImgContainer onClick={() => deleteHandler()}>
                    <OfferImg
                      src={selectedImageURL}
                      height="200"
                      alt="upload"
                    />
                  </OfferImgContainer>
                  <DetleteBtn
                    style={{}}
                    skelaton
                    onClick={() => deleteHandler()}
                  >
                    Delete
                  </DetleteBtn>
                </CurrentImageContainer>
              )}
            </Col>
            <Row style={{ justifyContent: "flex-start" }} gap="16px">
              <InputGrp>
                <Label>Offer Name</Label>
                <Input
                  type={"text"}
                  onChange={(e) => setName(e.target.value)}
                />
              </InputGrp>
              <InputGrp>
                <Label>Offer Type</Label>
                <SSelect
                  className="select-filter"
                  classNamePrefix="filter-opt"
                  options={offerTypes}
                  defaultValue={offerTypes[0]}
                  onChange={(value) => setOfferType(value)}
                />
              </InputGrp>
            </Row>
            <InputGrp>
              <Label>Description</Label>
              <TextArea onChange={(e) => setDescription(e.target.value)} />
            </InputGrp>
            <Row gap="38px">
              <CheckBoxInputGrp>
                <Checkbox
                  type="checkbox"
                  onChange={(e) => setApplicability("for_you")}
                />
                <Label>For you</Label>
              </CheckBoxInputGrp>
              <CheckBoxInputGrp>
                <Checkbox
                  type="checkbox"
                  onChange={(e) => setApplicability("for_partner")}
                />
                <Label>For Others</Label>
              </CheckBoxInputGrp>
            </Row>
            {offerType.value === "discount" ? (
              <>
                <InputGrp>
                  <Label>Applicable branches</Label>
                  <SSelect
                    fullWidth
                    className="select-filter"
                    classNamePrefix="filter-opt"
                    placeholder="Select Branches"
                    options={branches}
                    onChange={(value) => setSelectedBranch(value)}
                  />
                </InputGrp>
                <InputGrp>
                  <Label>Discount Type</Label>
                  <SSelect
                    fullWidth
                    className="select-filter"
                    classNamePrefix="filter-opt"
                    placeholder="Select Discount Type"
                    options={DiscountTypes}
                    onChange={(value) => setDiscountType(value)}
                  />
                </InputGrp>
                <Row>
                  <InputGrp gap="38px">
                    <Label>Discount Value</Label>
                    <Input
                      type={"number"}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </InputGrp>
                </Row>

                <Row gap="38px">
                  <InputGrp>
                    <Label>Original Price</Label>
                    <Input
                      type={"number"}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                  </InputGrp>
                  <InputGrp>
                    <Label>Offer cap</Label>
                    <Input
                      disabled={discountType.value === "value" ? true : false}
                      onChange={(e) => setOfferCap(e.target.value)}
                      type={"number"}
                    />
                  </InputGrp>
                </Row>

                <InputGrp>
                  <Label>Redeem Duration</Label>
                  <DateRangePickerV2 setSelectedDate={setSelectedDate} />
                </InputGrp>
              </>
            ) : null}
            {offerType.value === "gift" ? (
              <>
                <InputGrp>
                  <Label>Main Produt Name</Label>
                  <Input onChange={(e) => setMainProductName(e.target.value)} />
                </InputGrp>
                <InputGrp>
                  <Label>Gift Value</Label>
                  <Input
                    // fullWidth
                    // className="select-filter"
                    // classNamePrefix="filter-opt"
                    onChange={(e) => setSelectedGiftValue(e.target.value)}
                  />
                </InputGrp>
                <InputGrp>
                  <Label>Offer Duration</Label>
                  <DateRangePickerV2 setSelectedDate={setSelectedDate} />
                </InputGrp>
              </>
            ) : null}
            {error && <Error>{error}</Error>}

            <PrimaryBtn disabled={isDisabled()} onClick={() => onSubmit()}>
              Request Offer
            </PrimaryBtn>
          </Form>
        )}
      </Col>
    </Layout>
  );
}

const CurrentImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 160px;
`;

const DetleteBtn = styled.button`
  padding: 16px 32px;
  border-radius: 15px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 1rem;
  background: #ffffff;
  border: 1px solid #939baf;
  border-radius: 15px;
  font-family: GilroyMedium;
  width: 100%;
`;

const UploadOfferImage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 160px;

  input {
    display: none;
  }
  label {
    background-color: rgb(236, 232, 86);
    font-family: GilroyBold, sans-serif;
    padding: 16px 32px;
    border-radius: 15px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 1rem;
    width: 100%;
  }
  #file-chosen {
    margin-left: 0.3rem;
  }
`;
const OfferImgContainer = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
`;

const OfferImg = styled.img`
  width: 110px;
  height: 110px;
  object-fit: cover;
`;

const CheckBoxInputGrp = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  align-items: center;
  flex: none;
  gap: 21px;
  box-sizing: border-box;
`;

const Checkbox = styled.input`
  width: 28px;
  height: 28px;
  border: solid 1px black;
  border-radius: 10px;
`;

const UploadImageBadege = styled.div`
  width: 110px;
  height: 110px;
  /* border: solid 1px black; */
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: #fff;
  background: #0d9aff55;
`;

const Error = styled.div`
  width: 100%;
  text-align: center;
  color: red;
  font-size: 16px;
  font-family: "GilroyBold";
`;
