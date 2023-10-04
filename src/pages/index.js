import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {ethers} from 'ethers'
import { useEffect, useState } from "react";

const nftAddress = "0x16A9b6E13A2C6D9CCf96cF0180D74A1F362762Af" //sepolia
import nftAbi from "../abi.json"
import pets from "../pets.json"
const SEPOLIA_CHAIN_ID = 11155111

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [hasMetamask, setHasMetamask] = useState(false);
  const [signer, setSigner] = useState(undefined);
  const [signerAddress, setSignerAddress] = useState(undefined);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
    for (let i = 0; i < pets.length; i++) {
      check(i);
    }
  });

  async function connect() {
    if (window.ethereum) {

      try {
        await window.ethereum.request({
           method: 'wallet_switchEthereumChain',  params: [{ chainId: ethers.toQuantity(SEPOLIA_CHAIN_ID) }],
        });
      } catch (error) {
        console.error(error);
      }

      try {
        window.ethereum.request({ method: "eth_requestAccounts" })
          .then(handleAccountsChanged)
          .catch( (err) => {console.error(err);
        })

        await window.ethereum.on('accountsChanged', handleAccountsChanged)
        async function handleAccountsChanged(accounts){
          if (accounts.length === 0){
            console.log("Please Connect Metamask");
            return;
          }
          else if (accounts[0] != signerAddress){
            const provider = new ethers.BrowserProvider(window.ethereum);
            let signer = await provider.getSigner()
            setSigner(signer);
            setSignerAddress(await signer.getAddress())
            setIsConnected(true)
            return ;
          }
        }        
      } catch (e) {
        console.log(e);
      }
    } else {
      setIsConnected(false);
    }
  }

  async function check(id) {
    if (isConnected) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const adoption = new ethers.Contract(nftAddress, nftAbi, provider);
      let adopters = await adoption.getAdopters();
      console.log("id : ",adopters[id]);
      if (adopters[id] != ethers.ZeroAddress){
        document.getElementById(id).innerHTML = "Adopted";
        document.getElementById(id).disabled = true;
        return;
      }
      document.getElementById(id).disabled = false; 
      return;
    }
    else {
      document.getElementById(id).disabled = true;
      return;
    }
  }

  async function adopt(id) {
    if (isConnected) {
      const adoption = new ethers.Contract(nftAddress, nftAbi, signer);
      console.log("Adoption Contract : ",await adoption.getAddress());

      try {
        console.log(`Callling adopt(${id})`);
        let tx = await adoption.connect(signer).adopt(id);
        document.getElementById(id).innerHTML = "... Adopting ...";
        const receipt = await tx.wait();
        console.log("receipt : ",receipt);
        document.getElementById(id).innerHTML = "Success!";
        document.getElementById(id).disabled = true;
      } catch (error) {
        console.log(error);
        document.getElementById(id).innerHTML = "Adopt";
      }
    } 
    else {
      console.log("Please Conect your Metamask Wallet");
    }
  }

  async function page_init() {
    try {
      
      var petsRows = document.getElementById('petsRow');
      var pet = document.getElementById('petTemplate');
      // console.log(pet.innerHTML);
      for(let i = 0; i < pets.length; i++) {
        let obj = pets[i];
        
        var petInnerHTML = pet.innerHTML
        petInnerHTML = petInnerHTML.replace('style={{display: "none"}}', '')
        petInnerHTML = petInnerHTML.replace('Scrappy', obj.name) 
        petInnerHTML = petInnerHTML.replace('Golden Retriever', obj.breed)
        petInnerHTML = petInnerHTML.replace('3', obj.age)
        petInnerHTML = petInnerHTML.replace('Warren, MI', obj.location)
        petInnerHTML = petInnerHTML.replace('https://animalso.com/wp-content/uploads/2017/01/Golden-Retriever_6.jpg', obj.picture)
        petInnerHTML = petInnerHTML.replace('<button className="btn btn-default btn-adopt" data-id="0">Adopt</button>', '<button className="btn btn-default btn-adopt" onclick={() => adopt()} data-id="0">Adopt</button>')


        petsRows.innerHTML += petInnerHTML


        // pet.getElementsByClassName('panel-title').text = obj.name;
        // petsRows.appendChild(pet);
        // console.log(pet.innerHTML);

      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Pet Adoption</title>
        <meta name="description" content="Demo Dapp for pet Adoption" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>

        <div className={styles.connect}>
          {hasMetamask ? 
            ( isConnected ? 
              (<strong >Connected Wallet : {signerAddress}</strong>)
                : 
              (<button  onClick={() => connect()}> Connect Wallet </button>)
            ) : 
            ("Please install Metamask")
          }
        </div>
        <br/><br/>
        
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-sm-8 col-sm-push-2">
              <h1 className="text-center">Demo Pet Shop</h1>
              <hr/>
              <br/>
            </div>
          </div>

          <div id="petsRow" className="row">
            {/* <!-- PETS LOAD HERE --> */}       
            { pets.map((pet) => (
            <div key={pet.name}>
              <div className="col-sm-6 col-md-4 col-lg-3">
                <div className="panel panel-default panel-pet">
                  
                    <div className="panel-heading">
                      <h3 className="panel-title">{pet.name}</h3>
                    </div>
                    <div className="panel-body" style={{color:"black"}}>
                      <img alt="140x140" className="img-rounded img-center" style={{width: "100%"}} src={pet.picture} data-holder-rendered="true"/>
                      <br/><br/>
                      <strong>Breed</strong>: <span className="pet-breed">{pet.breed}</span><br/>
                      <strong>Age</strong>: <span className="pet-age">{pet.age}</span><br/>
                      <strong>Location</strong>: <span className="pet-location">{pet.location}</span><br/><br/>
                      <button className="btn btn-default btn-adopt" id={pet.id} onClick={() => adopt(pet.id)}>Adopt</button>
                    </div>               
                </div>
                
              </div>
            </div>
            ))
          }
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
